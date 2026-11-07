from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class CashbackRecordResponse(BaseModel):
    id: int
    transaction_id: int
    amount: Decimal
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CashbackSummaryResponse(BaseModel):
    total_cashback: Decimal
    monthly_cashback: Decimal
    history: List[CashbackRecordResponse]
    calculation_details: Optional[str] = None
