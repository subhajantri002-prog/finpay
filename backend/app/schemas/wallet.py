from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator


class WalletResponse(BaseModel):
    id: int
    user_id: int
    balance: Decimal
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TopupRequest(BaseModel):
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("Top-up amount must be greater than zero")
        if v > Decimal("10000.00"):
            raise ValueError("Maximum top-up amount is ₹10,000 per request")
        # Round to 2 decimal places
        return round(v, 2)
