import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from ...database.session import get_db
from ...models.evidence import Evidence
from ...schemas.schemas import EvidenceResponse
from ...services.evidence_service import EvidenceService
from ..deps import get_current_user, log_audit_event

router = APIRouter(prefix="/evidence", tags=["Evidence Vault"])

@router.post("/upload", response_model=EvidenceResponse)
async def upload_evidence(
    complaint_id: int = Form(...),
    category: str = Form("Transaction Screenshot"),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = EvidenceService(db)
    evidence = await service.save_evidence(
        complaint_id=complaint_id,
        user=current_user,
        file=file,
        category=category,
        notes=notes
    )
    return {
        "id": evidence.id,
        "complaint_id": evidence.complaint_id,
        "file_name": evidence.file_name,
        "file_path": evidence.file_path,
        "file_size": evidence.file_size,
        "file_type": evidence.file_type,
        "category": evidence.category,
        "sha256_hash": evidence.sha256_hash,
        "notes": evidence.notes,
        "uploaded_at": evidence.uploaded_at,
        "uploader_name": current_user.full_name
    }

@router.get("/{complaint_id}", response_model=List[EvidenceResponse])
def get_complaint_evidence(complaint_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    evidences = db.query(Evidence).filter(Evidence.complaint_id == complaint_id).order_by(Evidence.uploaded_at.desc()).all()
    return [
        {
            "id": e.id,
            "complaint_id": e.complaint_id,
            "file_name": e.file_name,
            "file_path": e.file_path,
            "file_size": e.file_size,
            "file_type": e.file_type,
            "category": e.category,
            "sha256_hash": e.sha256_hash,
            "notes": e.notes,
            "uploaded_at": e.uploaded_at,
            "uploader_name": e.uploader.full_name if e.uploader else "Officer"
        }
        for e in evidences
    ]

@router.get("/verify/{evidence_id}")
def verify_evidence_hash(evidence_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    service = EvidenceService(db)
    return service.verify_integrity(evidence_id, current_user)

@router.get("/download/{evidence_id}")
def download_evidence(evidence_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence or not os.path.exists(evidence.file_path):
        raise HTTPException(status_code=404, detail="Evidence file not found")
    
    log_audit_event(
        db,
        action="EVIDENCE_ACCESSED",
        resource_type="Evidence",
        resource_id=str(evidence.id),
        details=f"File {evidence.file_name} accessed/downloaded by {current_user.full_name}",
        user_id=current_user.id
    )

    return FileResponse(
        path=evidence.file_path,
        filename=evidence.file_name,
        media_type="application/octet-stream"
    )

