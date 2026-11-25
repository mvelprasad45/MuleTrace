from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from ..database.session import Base

class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String(64), unique=True, index=True, nullable=False)
    masked_account_number = Column(String(64), nullable=False)
    bank_name = Column(String(128), index=True, nullable=False)
    ifsc_code = Column(String(32), nullable=False)
    account_holder_name = Column(String(255), nullable=False)
    account_type = Column(String(64), default="Savings") # Savings, Current, NRE, Wallet
    upi_id = Column(String(128), index=True, nullable=True)
    device_id = Column(String(128), index=True, nullable=True) # Synthetic Device Identifier
    ip_address = Column(String(64), nullable=True) # Synthetic IP
    branch_city = Column(String(128), default="Mumbai")
    risk_score = Column(Float, default=0.0) # 0 to 100
    risk_category = Column(String(32), default="Low") # Low, Medium, High, Critical
    is_frozen = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

