from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database.session import Base

class LinkedComplaint(Base):
    __tablename__ = "linked_complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_a_id = Column(Integer, ForeignKey("complaints.id"), index=True, nullable=False)
    complaint_b_id = Column(Integer, ForeignKey("complaints.id"), index=True, nullable=False)
    shared_account_id = Column(Integer, ForeignKey("bank_accounts.id"), index=True, nullable=False)
    connection_type = Column(String(64), default="Shared Destination Mule") # e.g. Shared Destination Mule, Direct Convergence, Shared Device
    path_summary = Column(Text, nullable=False)
    total_combined_amount = Column(Float, nullable=False)
    confidence_score = Column(Float, default=90.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint_a = relationship("Complaint", foreign_keys=[complaint_a_id])
    complaint_b = relationship("Complaint", foreign_keys=[complaint_b_id])
    shared_account = relationship("BankAccount", foreign_keys=[shared_account_id])

