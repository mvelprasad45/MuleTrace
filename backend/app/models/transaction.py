from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database.session import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    utr_number = Column(String(64), unique=True, index=True, nullable=False)
    from_account_id = Column(Integer, ForeignKey("bank_accounts.id"), index=True, nullable=False)
    to_account_id = Column(Integer, ForeignKey("bank_accounts.id"), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_date = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    transaction_type = Column(String(32), default="IMPS") # IMPS, UPI, NEFT, RTGS
    status = Column(String(32), default="Completed")
    channel = Column(String(64), default="Mobile Banking")
    remarks = Column(String(255), nullable=True)

    from_account = relationship("BankAccount", foreign_keys=[from_account_id], backref="outgoing_txns")
    to_account = relationship("BankAccount", foreign_keys=[to_account_id], backref="incoming_txns")

