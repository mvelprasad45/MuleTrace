import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from ..database.session import Base

class UserRole(str, enum.Enum):
    ADMIN = "Administrator"
    INVESTIGATOR = "Investigation Officer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    badge_number = Column(String(64), unique=True, index=True, nullable=True)
    role = Column(String(64), default=UserRole.INVESTIGATOR.value, nullable=False)
    department = Column(String(128), default="Cyber Crime Unit, Financial Intelligence Division")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

