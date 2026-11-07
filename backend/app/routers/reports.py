from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.report import MonthlySpendingResponse, ReconciliationResponse
from app.services.auth_service import get_current_user
from app.services.report_service import get_monthly_spending, get_reconciliation

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/monthly-spending", response_model=MonthlySpendingResponse)
def get_spending_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Monthly spending breakdown aggregated strictly from the user's real transactions."""
    return get_monthly_spending(db, current_user.id)


@router.get("/reconciliation", response_model=ReconciliationResponse)
def get_reconciliation_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reconciliation summary calculated strictly from the user's real credit, debit, and cashback data."""
    return get_reconciliation(db, current_user.id)
