from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.cashback import Cashback
from app.models.cashback_config import CashbackConfig
from app.models.user import User
from app.schemas.cashback import CashbackRecordResponse, CashbackSummaryResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/cashback", tags=["Cashback"])


@router.get("", response_model=CashbackSummaryResponse)
def get_cashback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve user's cashback summary and history based strictly on stored records.
    Empty state returns ₹0.00 and an empty list.
    """
    records = (
        db.query(Cashback)
        .filter(Cashback.user_id == current_user.id)
        .order_by(Cashback.created_at.desc())
        .all()
    )

    now = datetime.now(timezone.utc)
    current_month_str = now.strftime("%Y-%m")

    total_cashback = Decimal("0.00")
    monthly_cashback = Decimal("0.00")

    history = []
    for r in records:
        total_cashback += r.amount
        if r.created_at.strftime("%Y-%m") == current_month_str:
            monthly_cashback += r.amount

        history.append(
            CashbackRecordResponse(
                id=r.id,
                transaction_id=r.transaction_id,
                amount=r.amount,
                status=r.status,
                created_at=r.created_at
            )
        )

    # Active calculation rule info if present in DB
    rule = (
        db.query(CashbackConfig)
        .filter(CashbackConfig.is_active == True)
        .order_by(CashbackConfig.id.desc())
        .first()
    )
    calculation_details = None
    if rule and rule.percentage > Decimal("0.00"):
        calculation_details = f"{rule.percentage}% cashback on eligible merchant payments of at least ₹{rule.min_transaction_amount:.2f}"
    elif settings.CASHBACK_PERCENTAGE > Decimal("0.00"):
        calculation_details = f"{settings.CASHBACK_PERCENTAGE}% cashback on eligible merchant payments of at least ₹{settings.CASHBACK_MIN_AMOUNT:.2f}"

    return CashbackSummaryResponse(
        total_cashback=total_cashback,
        monthly_cashback=monthly_cashback,
        history=history,
        calculation_details=calculation_details
    )
