from datetime import datetime
from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, asc, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.merchant import Merchant
from app.models.transaction import Transaction
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas.transaction import TransactionResponse, PaginatedTransactionsResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("", response_model=PaginatedTransactionsResponse)
def get_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term in description or merchant name"),
    status: Optional[str] = Query(None, description="Filter by status ('success', 'failed')"),
    type: Optional[str] = Query(None, description="Filter by type ('debit', 'credit', 'topup')"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    sort_by: str = Query("created_at", pattern="^(created_at|amount)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve paginated, filtered, and sorted transactions belonging exclusively to the current user.
    """
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not wallet:
        return PaginatedTransactionsResponse(items=[], total=0, page=page, page_size=page_size, total_pages=0)

    query = (
        db.query(Transaction, Merchant.name.label("merchant_name"))
        .outerjoin(Merchant, Transaction.merchant_id == Merchant.id)
        .filter(Transaction.wallet_id == wallet.id)
    )

    # Search filter
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.description.ilike(search_term),
                Merchant.name.ilike(search_term)
            )
        )

    # Status filter
    if status:
        query = query.filter(Transaction.status == status.strip())

    # Type filter
    if type:
        query = query.filter(Transaction.type == type.strip())

    # Date filters
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Transaction.created_at >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            # End of the specified day
            end_dt = datetime.strptime(f"{end_date} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Transaction.created_at <= end_dt)
        except ValueError:
            pass

    # Total count before pagination
    total = query.count()

    # Sorting
    sort_col = getattr(Transaction, sort_by)
    order_func = desc if sort_order == "desc" else asc
    query = query.order_by(order_func(sort_col))

    # Pagination
    offset = (page - 1) * page_size
    results = query.offset(offset).limit(page_size).all()

    items = [
        TransactionResponse(
            id=tx.id,
            wallet_id=tx.wallet_id,
            merchant_id=tx.merchant_id,
            merchant_name=m_name,
            amount=tx.amount,
            status=tx.status,
            type=tx.type,
            description=tx.description,
            idempotency_key=tx.idempotency_key,
            created_at=tx.created_at
        )
        for tx, m_name in results
    ]

    total_pages = ceil(total / page_size) if total > 0 else 0

    return PaginatedTransactionsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{id}", response_model=TransactionResponse)
def get_transaction_by_id(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve details of a single transaction belonging to the user."""
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found.")

    res = (
        db.query(Transaction, Merchant.name.label("merchant_name"))
        .outerjoin(Merchant, Transaction.merchant_id == Merchant.id)
        .filter(Transaction.id == id, Transaction.wallet_id == wallet.id)
        .first()
    )

    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    tx, m_name = res
    return TransactionResponse(
        id=tx.id,
        wallet_id=tx.wallet_id,
        merchant_id=tx.merchant_id,
        merchant_name=m_name,
        amount=tx.amount,
        status=tx.status,
        type=tx.type,
        description=tx.description,
        idempotency_key=tx.idempotency_key,
        created_at=tx.created_at
    )
