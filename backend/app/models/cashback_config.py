from decimal import Decimal
from sqlalchemy import Column, Integer, Numeric, Boolean

from app.core.database import Base


class CashbackConfig(Base):
    __tablename__ = "cashback_config"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    percentage = Column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    min_transaction_amount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
