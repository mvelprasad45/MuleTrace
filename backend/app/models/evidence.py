from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database.session import Base

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), index=True, nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False) # bytes
    file_type = Column(String(64), nullable=False)
    category = Column(String(64), default="Transaction Screenshot") 
    # Categories: Bank Statement, Transaction Screenshot, SMS Screenshot, WhatsApp Screenshot, Email Evidence, Other
    sha256_hash = Column(String(64), index=True, nullable=False) # File integrity verification
    notes = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="evidences")
    uploader = relationship("User")

