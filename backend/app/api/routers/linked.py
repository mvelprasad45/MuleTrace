from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database.session import get_db
from ...models.linked_complaint import LinkedComplaint
from ...schemas.schemas import LinkedComplaintResponse
from ...algorithms.linked_detector import LinkedComplaintDetector
from ..deps import get_current_user

router = APIRouter(prefix="/linked-complaints", tags=["Linked Complaints"])

@router.get("", response_model=List[LinkedComplaintResponse])
def get_linked_complaints(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    detector = LinkedComplaintDetector(db)
    detector.detect_linked_complaints()

    links = db.query(LinkedComplaint).order_by(LinkedComplaint.total_combined_amount.desc()).all()
    results = []
    for l in links:
        comp_a = l.complaint_a
        comp_b = l.complaint_b
        shared_acc = l.shared_account

        if not comp_a or not comp_b or not shared_acc:
            continue

        results.append({
            "id": l.id,
            "complaint_a_id": comp_a.id,
            "complaint_a_number": comp_a.complaint_number,
            "complaint_a_victim": comp_a.victim_name,
            "complaint_b_id": comp_b.id,
            "complaint_b_number": comp_b.complaint_number,
            "complaint_b_victim": comp_b.victim_name,
            "shared_account_id": shared_acc.id,
            "shared_account_masked": shared_acc.masked_account_number,
            "shared_bank_name": shared_acc.bank_name,
            "connection_type": l.connection_type,
            "path_summary": l.path_summary,
            "total_combined_amount": l.total_combined_amount,
            "confidence_score": l.confidence_score,
            "created_at": l.created_at
        })
    return results

@router.get("/{complaint_id}", response_model=List[LinkedComplaintResponse])
def get_links_for_complaint(complaint_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    links = db.query(LinkedComplaint).filter(
        (LinkedComplaint.complaint_a_id == complaint_id) | (LinkedComplaint.complaint_b_id == complaint_id)
    ).all()
    
    results = []
    for l in links:
        comp_a = l.complaint_a
        comp_b = l.complaint_b
        shared_acc = l.shared_account
        if not comp_a or not comp_b or not shared_acc:
            continue
        results.append({
            "id": l.id,
            "complaint_a_id": comp_a.id,
            "complaint_a_number": comp_a.complaint_number,
            "complaint_a_victim": comp_a.victim_name,
            "complaint_b_id": comp_b.id,
            "complaint_b_number": comp_b.complaint_number,
            "complaint_b_victim": comp_b.victim_name,
            "shared_account_id": shared_acc.id,
            "shared_account_masked": shared_acc.masked_account_number,
            "shared_bank_name": shared_acc.bank_name,
            "connection_type": l.connection_type,
            "path_summary": l.path_summary,
            "total_combined_amount": l.total_combined_amount,
            "confidence_score": l.confidence_score,
            "created_at": l.created_at
        })
    return results

