from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.wallet import WalletResponse, TopupRequest
from app.services.auth_service import get_current_user
from app.services.wallet_service import get_user_wallet, topup_wallet

router = APIRouter(prefix="/wallet", tags=["Wallet"])


@router.get("", response_model=WalletResponse)
def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the authenticated user's wallet details."""
    wallet = get_user_wallet(db, current_user.id)
    return wallet


@router.post("/topup", response_model=WalletResponse)
def topup(
    req: TopupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Demo top-up endpoint enabled only when DEMO_MODE=true in .env.
    Adds money up to ₹10,000 to the authenticated student's wallet.
    """
    wallet = topup_wallet(db, current_user, req.amount)
    return wallet
