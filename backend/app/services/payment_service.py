from decimal import Decimal
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.cashback import Cashback
from app.models.cashback_config import CashbackConfig
from app.models.merchant import Merchant
from app.models.transaction import Transaction
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas.transaction import PaymentRequest


def process_payment(
    db: Session,
    user: User,
    req: PaymentRequest,
    idempotency_key: Optional[str] = None
) -> Tuple[Transaction, Decimal]:
    """
    Process payment atomically:
    1. Check idempotency key - if already executed, return original transaction.
    2. Validate amount > 0.
    3. Check merchant exists and is active.
    4. Acquire atomic write lock (BEGIN IMMEDIATE for SQLite, SELECT ... FOR UPDATE for other DBMS).
    5. Debit wallet, credit merchant.
    6. Record transaction with idempotency key.
    7. Calculate and record cashback if active rule exists.
    8. Roll back all on any failure.
    """
    clean_idempotency = idempotency_key.strip() if idempotency_key else None

    # Check existing idempotency key
    if clean_idempotency:
        existing_tx = (
            db.query(Transaction)
            .filter(Transaction.idempotency_key == clean_idempotency)
            .first()
        )
        if existing_tx:
            # Check that this belongs to the user's wallet
            user_wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
            if not user_wallet or existing_tx.wallet_id != user_wallet.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Idempotency key has already been used for another transaction"
                )
            return existing_tx, user_wallet.balance

    # Validate amount > 0
    if req.amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Payment amount must be greater than zero."
        )

    try:
        # Detect SQLite dialect to apply BEGIN IMMEDIATE for exclusive write serialization
        is_sqlite = False
        bind = db.get_bind()
        if bind and bind.dialect.name == "sqlite":
            is_sqlite = True
            try:
                db.connection().exec_driver_sql("BEGIN IMMEDIATE")
            except Exception:
                pass  # Transaction already active on connection

        # Check merchant
        merchant_query = db.query(Merchant).filter(Merchant.id == req.merchant_id)
        if not is_sqlite:
            merchant_query = merchant_query.with_for_update()
        merchant = merchant_query.first()

        if not merchant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Merchant not found."
            )
        if not merchant.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Merchant is currently inactive."
            )

        # Check and lock wallet row
        wallet_query = db.query(Wallet).filter(Wallet.user_id == user.id)
        if not is_sqlite:
            wallet_query = wallet_query.with_for_update()
        wallet = wallet_query.first()

        if not wallet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wallet not found."
            )
        if wallet.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Wallet is not active."
            )

        # Check balance
        if wallet.balance < req.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient balance. Your balance is ₹{wallet.balance:.2f}."
            )

        # Debit wallet & credit merchant
        wallet.balance -= req.amount
        merchant.balance += req.amount

        # Create transaction record
        tx = Transaction(
            wallet_id=wallet.id,
            merchant_id=merchant.id,
            amount=req.amount,
            status="success",
            type="debit",
            description=req.description.strip() if req.description else f"Payment to {merchant.name}",
            idempotency_key=clean_idempotency
        )
        db.add(tx)
        db.flush()

        # Check Cashback Rule (from DB config or env fallback)
        cashback_percentage = Decimal("0.00")
        min_amount = Decimal("0.00")

        db_rule = (
            db.query(CashbackConfig)
            .filter(CashbackConfig.is_active == True)
            .order_by(CashbackConfig.id.desc())
            .first()
        )
        if db_rule and db_rule.percentage > Decimal("0.00"):
            cashback_percentage = db_rule.percentage
            min_amount = db_rule.min_transaction_amount
        elif settings.CASHBACK_PERCENTAGE > Decimal("0.00"):
            cashback_percentage = settings.CASHBACK_PERCENTAGE
            min_amount = settings.CASHBACK_MIN_AMOUNT

        if cashback_percentage > Decimal("0.00") and req.amount >= min_amount:
            cashback_amount = round(req.amount * (cashback_percentage / Decimal("100.00")), 2)
            if cashback_amount > Decimal("0.00"):
                # Credit cashback to wallet
                wallet.balance += cashback_amount
                cb_record = Cashback(
                    user_id=user.id,
                    transaction_id=tx.id,
                    amount=cashback_amount,
                    status="credited"
                )
                db.add(cb_record)

        # Commit atomic transaction
        db.commit()
        db.refresh(tx)
        db.refresh(wallet)
        return tx, wallet.balance

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment processing failed: {str(e)}"
        )
