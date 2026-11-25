import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from ...database.session import get_db
from ...models.complaint import Complaint
from ...models.transaction import Transaction
from ...models.bank_account import BankAccount
from ...models.suspicious_account import SuspiciousAccount
from ...models.audit_log import AuditLog
from ...schemas.schemas import DashboardStatsResponse
from ..deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    total_complaints = db.query(Complaint).count()
    transactions_analysed = db.query(Transaction).count()
    suspicious_accounts = db.query(BankAccount).filter(BankAccount.risk_score >= 40.0).count()
    active_investigations = db.query(Complaint).filter(Complaint.status.in_(["New", "Under Investigation", "Escalated"])).count()
    high_risk_networks = db.query(BankAccount).filter(BankAccount.risk_score >= 70.0).count()
    
    total_defrauded = db.query(func.sum(Complaint.amount)).scalar() or 0.0
    frozen_accounts = db.query(BankAccount).filter(BankAccount.is_frozen == True).all()
    frozen_account_ids = [a.id for a in frozen_accounts]
    total_frozen = db.query(func.sum(Transaction.amount)).filter(Transaction.to_account_id.in_(frozen_account_ids)).scalar() or 0.0

    # Risk Distribution
    risk_dist = {
        "Low": db.query(BankAccount).filter(BankAccount.risk_score < 31.0).count(),
        "Medium": db.query(BankAccount).filter(BankAccount.risk_score.between(31.0, 60.0)).count(),
        "High": db.query(BankAccount).filter(BankAccount.risk_score.between(61.0, 80.0)).count(),
        "Critical": db.query(BankAccount).filter(BankAccount.risk_score > 80.0).count()
    }

    # Daily volume calculation (last 7 synthetic days)
    daily_volume = [
        {"day": "Day 1", "amount": 85000, "txns": 8},
        {"day": "Day 2", "amount": 142000, "txns": 14},
        {"day": "Day 3", "amount": 210000, "txns": 19},
        {"day": "Day 4", "amount": 178000, "txns": 16},
        {"day": "Day 5", "amount": 315000, "txns": 26},
        {"day": "Day 6", "amount": 289000, "txns": 22},
        {"day": "Day 7", "amount": 420000, "txns": 31}
    ]

    # Fraud pattern counts
    patterns = [
        {"name": "Rapid Pass-Through Mule", "count": 12, "risk": "High"},
        {"name": "Fan-Out Layering Smurf", "count": 8, "risk": "Critical"},
        {"name": "Circular Ring Cycle", "count": 4, "risk": "Critical"},
        {"name": "Synthetic Device Sharing", "count": 7, "risk": "High"},
        {"name": "High Velocity Inflow", "count": 9, "risk": "Medium"}
    ]

    return {
        "total_complaints": total_complaints,
        "transactions_analysed": transactions_analysed,
        "suspicious_accounts": suspicious_accounts,
        "active_investigations": active_investigations,
        "high_risk_networks": high_risk_networks,
        "total_defrauded_amount": total_defrauded,
        "total_frozen_amount": total_frozen,
        "network_distribution": risk_dist,
        "daily_volume": daily_volume,
        "fraud_pattern_breakdown": patterns
    }

@router.get("/activities")
def get_dashboard_activities(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(15).all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }
        for log in logs
    ]

