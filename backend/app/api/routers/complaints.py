from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
from ...database.session import get_db
from ...models.complaint import Complaint
from ...models.investigation_note import InvestigationNote
from ...models.user import User
from ...schemas.schemas import ComplaintCreate, ComplaintUpdate, ComplaintResponse, NoteCreate, NoteResponse
from ..deps import get_current_user, log_audit_event

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.post("", response_model=ComplaintResponse)
def create_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Auto-generate unique Complaint ID: COMP-2026-XXXX
    count = db.query(Complaint).count()
    comp_number = f"COMP-2026-{1001 + count}"

    complaint = Complaint(
        complaint_number=comp_number,
        victim_name=payload.victim_name,
        victim_mobile=payload.victim_mobile,
        bank_name=payload.bank_name,
        masked_account_number=payload.masked_account_number,
        utr_number=payload.utr_number,
        amount=payload.amount,
        transaction_date=payload.transaction_date,
        transaction_time=payload.transaction_time,
        suspected_upi_id=payload.suspected_upi_id,
        suspected_account_number=payload.suspected_account_number,
        fraud_description=payload.fraud_description,
        priority=payload.priority or "High",
        status="New",
        assigned_investigator_id=current_user.id
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    log_audit_event(
        db,
        action="COMPLAINT_REGISTERED",
        resource_type="Complaint",
        resource_id=complaint.complaint_number,
        details=f"Defrauded: ₹{complaint.amount:,.2f}, Victim: {complaint.victim_name}, UTR: {complaint.utr_number}",
        user_id=current_user.id
    )

    return complaint

@router.get("", response_model=List[ComplaintResponse])
def list_complaints(
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Complaint)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Complaint.complaint_number.ilike(s),
                Complaint.victim_name.ilike(s),
                Complaint.utr_number.ilike(s),
                Complaint.bank_name.ilike(s)
            )
        )
    if status and status != "All":
        query = query.filter(Complaint.status == status)
    if priority and priority != "All":
        query = query.filter(Complaint.priority == priority)

    complaints = query.order_by(Complaint.created_at.desc()).all()
    
    out = []
    for c in complaints:
        assigned_name = c.assigned_investigator.full_name if c.assigned_investigator else "Unassigned"
        out.append({
            "id": c.id,
            "complaint_number": c.complaint_number,
            "victim_name": c.victim_name,
            "victim_mobile": c.victim_mobile,
            "bank_name": c.bank_name,
            "masked_account_number": c.masked_account_number,
            "utr_number": c.utr_number,
            "amount": c.amount,
            "transaction_date": c.transaction_date,
            "transaction_time": c.transaction_time,
            "suspected_upi_id": c.suspected_upi_id,
            "suspected_account_number": c.suspected_account_number,
            "fraud_description": c.fraud_description,
            "status": c.status,
            "priority": c.priority,
            "assigned_investigator_id": c.assigned_investigator_id,
            "assigned_investigator_name": assigned_name,
            "created_at": c.created_at
        })
    return out

@router.get("/{id}", response_model=ComplaintResponse)
def get_complaint(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Complaint).filter(Complaint.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    assigned_name = c.assigned_investigator.full_name if c.assigned_investigator else "Unassigned"
    return {
        "id": c.id,
        "complaint_number": c.complaint_number,
        "victim_name": c.victim_name,
        "victim_mobile": c.victim_mobile,
        "bank_name": c.bank_name,
        "masked_account_number": c.masked_account_number,
        "utr_number": c.utr_number,
        "amount": c.amount,
        "transaction_date": c.transaction_date,
        "transaction_time": c.transaction_time,
        "suspected_upi_id": c.suspected_upi_id,
        "suspected_account_number": c.suspected_account_number,
        "fraud_description": c.fraud_description,
        "status": c.status,
        "priority": c.priority,
        "assigned_investigator_id": c.assigned_investigator_id,
        "assigned_investigator_name": assigned_name,
        "created_at": c.created_at
    }

@router.put("/{id}", response_model=ComplaintResponse)
def update_complaint(
    id: int,
    payload: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Complaint).filter(Complaint.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if payload.status:
        c.status = payload.status
    if payload.priority:
        c.priority = payload.priority
    if payload.assigned_investigator_id is not None:
        c.assigned_investigator_id = payload.assigned_investigator_id
    if payload.fraud_description:
        c.fraud_description = payload.fraud_description

    db.commit()
    db.refresh(c)
    
    log_audit_event(
        db,
        action="COMPLAINT_UPDATED",
        resource_type="Complaint",
        resource_id=c.complaint_number,
        details=f"Updated status: {c.status}, priority: {c.priority}",
        user_id=current_user.id
    )

    assigned_name = c.assigned_investigator.full_name if c.assigned_investigator else "Unassigned"
    return {
        "id": c.id,
        "complaint_number": c.complaint_number,
        "victim_name": c.victim_name,
        "victim_mobile": c.victim_mobile,
        "bank_name": c.bank_name,
        "masked_account_number": c.masked_account_number,
        "utr_number": c.utr_number,
        "amount": c.amount,
        "transaction_date": c.transaction_date,
        "transaction_time": c.transaction_time,
        "suspected_upi_id": c.suspected_upi_id,
        "suspected_account_number": c.suspected_account_number,
        "fraud_description": c.fraud_description,
        "status": c.status,
        "priority": c.priority,
        "assigned_investigator_id": c.assigned_investigator_id,
        "assigned_investigator_name": assigned_name,
        "created_at": c.created_at
    }

@router.post("/{id}/notes", response_model=NoteResponse)
def add_note(
    id: int,
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    note = InvestigationNote(
        complaint_id=complaint.id,
        author_id=current_user.id,
        note_text=payload.note_text,
        is_lead=payload.is_lead
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "id": note.id,
        "complaint_id": note.complaint_id,
        "note_text": note.note_text,
        "is_lead": note.is_lead,
        "author_name": current_user.full_name,
        "created_at": note.created_at
    }

@router.get("/{id}/notes", response_model=List[NoteResponse])
def get_notes(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notes = db.query(InvestigationNote).filter(InvestigationNote.complaint_id == id).order_by(InvestigationNote.created_at.desc()).all()
    return [
        {
            "id": n.id,
            "complaint_id": n.complaint_id,
            "note_text": n.note_text,
            "is_lead": n.is_lead,
            "author_name": n.author.full_name if n.author else "Officer",
            "created_at": n.created_at
        }
        for n in notes
    ]

