from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ...database.session import get_db
from ...models.complaint import Complaint
from ...schemas.schemas import MoneyTrailResponse
from ...algorithms.graph_engine import MoneyTrailGraphEngine
from ..deps import get_current_user

router = APIRouter(prefix="/trace", tags=["Money Trail Tracing"])

@router.get("/{complaint_id}", response_model=MoneyTrailResponse)
def trace_by_complaint(
    complaint_id: int,
    max_depth: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found")

    engine = MoneyTrailGraphEngine(db)
    result = engine.trace_money_trail(complaint=complaint, max_depth=max_depth)
    return result

@router.get("/transaction/{utr}", response_model=MoneyTrailResponse)
def trace_by_utr(
    utr: str,
    max_depth: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    engine = MoneyTrailGraphEngine(db)
    result = engine.trace_money_trail(utr_number=utr, max_depth=max_depth)
    return result

@router.get("/account/{account_id}", response_model=MoneyTrailResponse)
def trace_by_account(
    account_id: int,
    max_depth: int = Query(4, ge=1, le=8),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    engine = MoneyTrailGraphEngine(db)
    result = engine.trace_money_trail(account_id=account_id, max_depth=max_depth)
    return result

