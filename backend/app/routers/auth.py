from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token
from app.schemas.auth import RegisterRequest, LoginRequest
from app.schemas.user import UserResponse, TokenResponse
from app.services.auth_service import register_user, authenticate_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new student user and create their initial wallet with ₹0.00.
    Does NOT log the user in automatically.
    """
    user = register_user(db, req)
    return user


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user using email OR student ID plus password.
    Returns JWT access token and user information.
    """
    user = authenticate_user(db, req.identifier, req.password)
    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )
