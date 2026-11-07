from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, field_validator


class PaymentRequest(BaseModel):
    merchant_id: int
    amount: Decimal
    description: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("Payment amount must be greater than zero")
        return round(v, 2)


class TransactionResponse(BaseModel):
    id: int
    wallet_id: int
    merchant_id: Optional[int] = None
    merchant_name: Optional[str] = None
    amount: Decimal
    status: str
    type: str
    description: Optional[str] = None
    idempotency_key: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedTransactionsResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
