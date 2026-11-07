from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, decode_access_token
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas.auth import RegisterRequest

security_bearer = HTTPBearer(auto_error=False)


def register_user(db: Session, req: RegisterRequest) -> User:
    """Register a new student and automatically create an empty wallet."""
    # Check duplicate email
    existing_email = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered"
        )

    # Check duplicate student ID
    existing_student = db.query(User).filter(User.student_id == req.student_id.strip()).first()
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student ID is already registered"
        )

    # Hash password
    pwd_hash = get_password_hash(req.password)

    # Create User
    new_user = User(
        full_name=req.full_name.strip(),
        student_id=req.student_id.strip(),
        email=req.email.lower().strip(),
        phone=req.phone.strip() if req.phone else None,
        password_hash=pwd_hash,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Create empty wallet with balance ₹0.00
    new_wallet = Wallet(
        user_id=new_user.id,
        balance=0.00,
        status="active"
    )
    db.add(new_wallet)
    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(db: Session, identifier: str, password: str) -> User:
    """Authenticate user with email or student ID and password."""
    clean_identifier = identifier.strip()
    user = (
        db.query(User)
        .filter(
            (User.email == clean_identifier.lower()) | (User.student_id == clean_identifier)
        )
        .first()
    )

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to extract and validate the authenticated user from JWT token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
