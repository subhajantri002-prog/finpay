from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.merchant import Merchant
from app.models.user import User
from app.schemas.merchant import MerchantResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/merchants", tags=["Merchants"])


@router.get("", response_model=List[MerchantResponse])
def list_merchants(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve list of active campus merchants for payment."""
    merchants = db.query(Merchant).filter(Merchant.is_active == True).order_by(Merchant.name.asc()).all()
    return merchants
