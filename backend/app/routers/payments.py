from typing import Optional
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.merchant import Merchant
from app.models.user import User
from app.schemas.transaction import PaymentRequest, TransactionResponse
from app.services.auth_service import get_current_user
from app.services.payment_service import process_payment

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("", response_model=TransactionResponse)
def make_payment(
    req: PaymentRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process an atomic payment to an active merchant.
    Requires Idempotency-Key header for duplicate protection.
    """
    tx, _ = process_payment(db, current_user, req, idempotency_key=idempotency_key)
    
    merchant_name = None
    if tx.merchant_id:
        m = db.query(Merchant).filter(Merchant.id == tx.merchant_id).first()
        if m:
            merchant_name = m.name

    return TransactionResponse(
        id=tx.id,
        wallet_id=tx.wallet_id,
        merchant_id=tx.merchant_id,
        merchant_name=merchant_name,
        amount=tx.amount,
        status=tx.status,
        type=tx.type,
        description=tx.description,
        idempotency_key=tx.idempotency_key,
        created_at=tx.created_at
    )
