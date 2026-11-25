from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database.session import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_number = Column(String(64), unique=True, index=True, nullable=False) # e.g. COMP-2026-1001
    victim_name = Column(String(255), nullable=False)
    victim_mobile = Column(String(32), nullable=False)
    bank_name = Column(String(128), nullable=False)
    masked_account_number = Column(String(64), nullable=False)
    utr_number = Column(String(64), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_date = Column(String(32), nullable=False) # YYYY-MM-DD
    transaction_time = Column(String(32), nullable=False) # HH:MM:SS
    suspected_upi_id = Column(String(128), nullable=True)
    suspected_account_number = Column(String(64), nullable=True)
    fraud_description = Column(Text, nullable=False)
    status = Column(String(64), default="New") # New, Under Investigation, Evidence Required, Escalated, Closed
    priority = Column(String(32), default="High") # Low, Medium, High, Critical
    assigned_investigator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assigned_investigator = relationship("User", foreign_keys=[assigned_investigator_id])
    evidences = relationship("Evidence", back_populates="complaint", cascade="all, delete-orphan")
    notes = relationship("InvestigationNote", back_populates="complaint", cascade="all, delete-orphan")

