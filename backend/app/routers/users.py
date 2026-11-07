from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdateRequest
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_profile(
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update profile. Only phone number may be edited.
    Student ID, email, and is_active status are immutable.
    """
    if req.phone is not None:
        current_user.phone = req.phone.strip() if req.phone.strip() else None

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
