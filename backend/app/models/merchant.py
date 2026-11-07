from decimal import Decimal
from sqlalchemy import Column, Integer, String, Boolean, Numeric
from sqlalchemy.orm import relationship

from app.core.database import Base


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    balance = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)

    transactions = relationship("Transaction", back_populates="merchant")
