import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database.session import get_db
from ...models.bank_account import BankAccount
from ...models.suspicious_account import SuspiciousAccount
from ...models.transaction import Transaction
from ...schemas.schemas import SuspiciousAccountResponse
from ...algorithms.detection_engine import SuspiciousDetectionEngine
from ..deps import get_current_user, log_audit_event

router = APIRouter(prefix="/accounts", tags=["Suspicious Accounts"])

@router.get("/suspicious", response_model=List[SuspiciousAccountResponse])
def get_suspicious_accounts(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Run scan to ensure fresh results
    engine = SuspiciousDetectionEngine(db)
    engine.run_full_scan()

    susp_records = db.query(SuspiciousAccount).order_by(SuspiciousAccount.risk_score.desc()).all()
    results = []
    for s in susp_records:
        acc = s.account
        if not acc:
            continue
        try:
            rules = json.loads(s.detection_rules) if isinstance(s.detection_rules, str) else s.detection_rules
            reasons = json.loads(s.reasons) if isinstance(s.reasons, str) else s.reasons
        except Exception:
            rules = []
            reasons = []

        results.append({
            "id": s.id,
            "account_id": acc.id,
            "account_number_masked": acc.masked_account_number,
            "account_holder_name": acc.account_holder_name,
            "bank_name": acc.bank_name,
            "risk_score": s.risk_score,
            "risk_category": s.risk_category,
            "detection_rules": rules,
            "reasons": reasons,
            "device_id": acc.device_id,
            "ip_address": acc.ip_address,
            "is_frozen": acc.is_frozen,
            "detected_at": s.detected_at
        })
    return results

@router.get("/{account_id}/risk")
def get_account_risk_details(account_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    acc = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    engine = SuspiciousDetectionEngine(db)
    from ...algorithms.graph_engine import MoneyTrailGraphEngine
    g_engine = MoneyTrailGraphEngine(db)
    G = g_engine.build_global_graph()

    score, category, rules, reasons = engine.analyze_account(acc, G)

    incoming = db.query(Transaction).filter(Transaction.to_account_id == acc.id).all()
    outgoing = db.query(Transaction).filter(Transaction.from_account_id == acc.id).all()

    total_in = sum(t.amount for t in incoming)
    total_out = sum(t.amount for t in outgoing)

    return {
        "account_id": acc.id,
        "masked_account_number": acc.masked_account_number,
        "account_holder_name": acc.account_holder_name,
        "bank_name": acc.bank_name,
        "ifsc_code": acc.ifsc_code,
        "upi_id": acc.upi_id,
        "device_id": acc.device_id,
        "ip_address": acc.ip_address,
        "risk_score": score,
        "risk_category": category,
        "is_frozen": acc.is_frozen,
        "total_incoming_amount": total_in,
        "total_outgoing_amount": total_out,
        "incoming_count": len(incoming),
        "outgoing_count": len(outgoing),
        "triggered_rules": rules,
        "explainable_reasons": reasons
    }

@router.post("/{account_id}/toggle-freeze")
def toggle_account_freeze(account_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    acc = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    
    acc.is_frozen = not acc.is_frozen
    db.commit()
    db.refresh(acc)

    action = "ACCOUNT_FROZEN" if acc.is_frozen else "ACCOUNT_UNFROZEN"
    log_audit_event(
        db,
        action=action,
        resource_type="BankAccount",
        resource_id=acc.masked_account_number,
        details=f"Account status updated to is_frozen={acc.is_frozen} by officer {current_user.full_name}",
        user_id=current_user.id
    )

    return {
        "account_id": acc.id,
        "masked_account_number": acc.masked_account_number,
        "is_frozen": acc.is_frozen,
        "message": f"Account {acc.masked_account_number} debit lien {'applied' if acc.is_frozen else 'removed'}."
    }

