from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database.session import Base

class InvestigationReport(Base):
    __tablename__ = "investigation_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(64), unique=True, index=True, nullable=False) # e.g. REP-2026-9001
    complaint_id = Column(Integer, ForeignKey("complaints.id"), index=True, nullable=False)
    investigator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    pdf_path = Column(String(512), nullable=False)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint")
    investigator = relationship("User")

