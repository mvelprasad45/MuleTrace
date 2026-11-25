from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database.session import Base

class SuspiciousAccount(Base):
    __tablename__ = "suspicious_accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("bank_accounts.id"), unique=True, index=True, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_category = Column(String(32), nullable=False) # Low, Medium, High, Critical
    detection_rules = Column(Text, nullable=False) # JSON list string: ["RAPID_MONEY_MOVEMENT", "FAN_OUT", ...]
    reasons = Column(Text, nullable=False) # JSON array of detailed reason objects with evidence weights
    detected_at = Column(DateTime, default=datetime.utcnow)

    account = relationship("BankAccount")

