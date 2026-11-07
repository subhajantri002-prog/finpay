from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(50), nullable=False)  # "success", "failed"
    type = Column(String(50), nullable=False)    # "debit", "credit", "topup"
    description = Column(String(255), nullable=True)
    idempotency_key = Column(String(36), unique=True, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    wallet = relationship("Wallet", back_populates="transactions")
    merchant = relationship("Merchant", back_populates="transactions")
    cashback_record = relationship("Cashback", back_populates="transaction", uselist=False)
