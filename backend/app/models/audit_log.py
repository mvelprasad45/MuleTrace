from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from ..database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(128), nullable=False) # e.g. EVIDENCE_ACCESSED, REPORT_GENERATED, ACCOUNT_FROZEN_RECOMMENDED, COMPLAINT_CREATED
    resource_type = Column(String(64), nullable=False) # Complaint, Evidence, Account, Report
    resource_id = Column(String(64), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(64), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow)

