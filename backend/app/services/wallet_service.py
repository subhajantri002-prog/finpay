from decimal import Decimal
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.transaction import Transaction
from app.models.user import User
from app.models.wallet import Wallet


def get_user_wallet(db: Session, user_id: int) -> Wallet:
    """Retrieve wallet for a user."""
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found for this user."
        )
    return wallet


def topup_wallet(db: Session, user: User, amount: Decimal) -> Wallet:
    """
    Demo top-up enabled only when DEMO_MODE=true.
    Adds money to the user's wallet and records a transaction of type 'topup'.
    """
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo top-up mode is disabled on this server."
        )

    if amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Top-up amount must be greater than zero."
        )

    if amount > Decimal("10000.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum top-up amount is ₹10,000 per request."
        )

    try:
        bind = db.get_bind()
        is_sqlite = bind and bind.dialect.name == "sqlite"
        if is_sqlite:
            try:
                db.connection().exec_driver_sql("BEGIN IMMEDIATE")
            except Exception:
                pass

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
                detail="Wallet is inactive."
            )

        wallet.balance += amount

        tx = Transaction(
            wallet_id=wallet.id,
            merchant_id=None,
            amount=amount,
            status="success",
            type="topup",
            description="Demo Mode Wallet Top-Up",
            idempotency_key=None
        )
        db.add(tx)
        db.commit()
        db.refresh(wallet)
        return wallet

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Top-up failed: {str(e)}"
        )


def admin_credit_wallet(
    db: Session,
    student_id: str,
    amount: Decimal,
    description: Optional[str] = None
) -> Transaction:
    """
    Credits a REGISTERED user's wallet by student ID and amount.
    Records as transaction of type 'credit'.
    Fails if the user is not registered.
    """
    clean_student_id = student_id.strip()
    user = db.query(User).filter(User.student_id == clean_student_id).first()
    if not user:
        raise ValueError(f"User with student ID '{clean_student_id}' is not registered.")

    if amount <= Decimal("0.00"):
        raise ValueError("Credit amount must be greater than zero.")

    bind = db.get_bind()
    is_sqlite = bind and bind.dialect.name == "sqlite"
    if is_sqlite:
        try:
            db.connection().exec_driver_sql("BEGIN IMMEDIATE")
        except Exception:
            pass

    wallet_query = db.query(Wallet).filter(Wallet.user_id == user.id)
    if not is_sqlite:
        wallet_query = wallet_query.with_for_update()
    wallet = wallet_query.first()

    if not wallet:
        raise ValueError(f"No wallet found for student ID '{clean_student_id}'.")

    wallet.balance += amount
    tx = Transaction(
        wallet_id=wallet.id,
        merchant_id=None,
        amount=amount,
        status="success",
        type="credit",
        description=description.strip() if description else f"Admin credit for student {clean_student_id}",
        idempotency_key=None
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx
