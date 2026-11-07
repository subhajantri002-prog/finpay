from collections import defaultdict
from datetime import datetime
from decimal import Decimal
from typing import Dict, List
from sqlalchemy.orm import Session

from app.models.cashback import Cashback
from app.models.transaction import Transaction
from app.models.wallet import Wallet
from app.schemas.report import (
    MonthlySpendingItem,
    MonthlySpendingResponse,
    ReconciliationItem,
    ReconciliationResponse
)


def get_monthly_spending(db: Session, user_id: int) -> MonthlySpendingResponse:
    """Compute monthly spending for the user based strictly on their real transactions."""
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        return MonthlySpendingResponse(items=[], total_spent_all_time=Decimal("0.00"))

    # Fetch successful debit transactions
    debits = (
        db.query(Transaction)
        .filter(
            Transaction.wallet_id == wallet.id,
            Transaction.type == "debit",
            Transaction.status == "success"
        )
        .order_by(Transaction.created_at.asc())
        .all()
    )

    monthly_map: Dict[str, Dict] = defaultdict(lambda: {"total": Decimal("0.00"), "count": 0, "date": None})
    total_spent_all_time = Decimal("0.00")

    for tx in debits:
        month_key = tx.created_at.strftime("%Y-%m")
        monthly_map[month_key]["total"] += tx.amount
        monthly_map[month_key]["count"] += 1
        monthly_map[month_key]["date"] = tx.created_at
        total_spent_all_time += tx.amount

    items: List[MonthlySpendingItem] = []
    # Sort descending by month
    for month_key in sorted(monthly_map.keys(), reverse=True):
        data = monthly_map[month_key]
        month_name = data["date"].strftime("%B %Y")
        items.append(
            MonthlySpendingItem(
                month=month_key,
                month_name=month_name,
                total_spent=data["total"],
                transaction_count=data["count"]
            )
        )

    return MonthlySpendingResponse(
        items=items,
        total_spent_all_time=total_spent_all_time
    )


def get_reconciliation(db: Session, user_id: int) -> ReconciliationResponse:
    """Reconciliation report computed strictly from the user's real records."""
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        return ReconciliationResponse(
            current_wallet_balance=Decimal("0.00"),
            total_all_time_credits=Decimal("0.00"),
            total_all_time_debits=Decimal("0.00"),
            total_all_time_cashback=Decimal("0.00"),
            reconciled_balance=Decimal("0.00"),
            is_reconciled=True,
            monthly_breakdown=[]
        )

    # All transactions
    all_txs = (
        db.query(Transaction)
        .filter(
            Transaction.wallet_id == wallet.id,
            Transaction.status == "success"
        )
        .order_by(Transaction.created_at.asc())
        .all()
    )

    # All cashbacks
    all_cashbacks = (
        db.query(Cashback)
        .filter(
            Cashback.user_id == user_id,
            Cashback.status == "credited"
        )
        .order_by(Cashback.created_at.asc())
        .all()
    )

    total_credits = Decimal("0.00")
    total_debits = Decimal("0.00")
    total_cashback = Decimal("0.00")

    # Group by month
    monthly_data: Dict[str, Dict] = defaultdict(
        lambda: {
            "credits": Decimal("0.00"),
            "debits": Decimal("0.00"),
            "cashback": Decimal("0.00"),
            "date": None
        }
    )

    for tx in all_txs:
        m_key = tx.created_at.strftime("%Y-%m")
        monthly_data[m_key]["date"] = tx.created_at
        if tx.type in ("credit", "topup"):
            total_credits += tx.amount
            monthly_data[m_key]["credits"] += tx.amount
        elif tx.type == "debit":
            total_debits += tx.amount
            monthly_data[m_key]["debits"] += tx.amount

    for cb in all_cashbacks:
        total_cashback += cb.amount
        m_key = cb.created_at.strftime("%Y-%m")
        if not monthly_data[m_key]["date"]:
            monthly_data[m_key]["date"] = cb.created_at
        monthly_data[m_key]["cashback"] += cb.amount

    reconciled_balance = total_credits - total_debits + total_cashback
    is_reconciled = (reconciled_balance == wallet.balance)

    # Build monthly breakdown in chronological order to calculate running balances
    monthly_items: List[ReconciliationItem] = []
    running_balance = Decimal("0.00")

    for m_key in sorted(monthly_data.keys()):
        data = monthly_data[m_key]
        month_name = data["date"].strftime("%B %Y") if data["date"] else m_key
        start_bal = running_balance
        net_change = data["credits"] - data["debits"] + data["cashback"]
        end_bal = start_bal + net_change
        running_balance = end_bal

        monthly_items.append(
            ReconciliationItem(
                month=m_key,
                month_name=month_name,
                total_credits=data["credits"],
                total_debits=data["debits"],
                total_cashback=data["cashback"],
                net_change=net_change,
                starting_balance=start_bal,
                ending_balance=end_bal,
                status="Balanced"
            )
        )

    # Show newest first in response
    monthly_items.reverse()

    return ReconciliationResponse(
        current_wallet_balance=wallet.balance,
        total_all_time_credits=total_credits,
        total_all_time_debits=total_debits,
        total_all_time_cashback=total_cashback,
        reconciled_balance=reconciled_balance,
        is_reconciled=is_reconciled,
        monthly_breakdown=monthly_items
    )
