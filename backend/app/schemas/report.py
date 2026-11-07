from decimal import Decimal
from typing import List
from pydantic import BaseModel


class MonthlySpendingItem(BaseModel):
    month: str  # YYYY-MM
    month_name: str  # e.g. "November 2026"
    total_spent: Decimal
    transaction_count: int


class MonthlySpendingResponse(BaseModel):
    items: List[MonthlySpendingItem]
    total_spent_all_time: Decimal


class ReconciliationItem(BaseModel):
    month: str
    month_name: str
    total_credits: Decimal
    total_debits: Decimal
    total_cashback: Decimal
    net_change: Decimal
    starting_balance: Decimal
    ending_balance: Decimal
    status: str  # "Balanced"


class ReconciliationResponse(BaseModel):
    current_wallet_balance: Decimal
    total_all_time_credits: Decimal
    total_all_time_debits: Decimal
    total_all_time_cashback: Decimal
    reconciled_balance: Decimal
    is_reconciled: bool
    monthly_breakdown: List[ReconciliationItem]
