import os
import hashlib
from typing import Tuple
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from ..models.evidence import Evidence
from ..models.complaint import Complaint
from ..models.user import User
from ..api.deps import log_audit_event

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads/evidence")
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".txt", ".csv"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit

os.makedirs(UPLOAD_DIR, exist_ok=True)

class EvidenceService:
    def __init__(self, db: Session):
        self.db = db

    def calculate_sha256(self, file_bytes: bytes) -> str:
        sha256 = hashlib.sha256()
        sha256.update(file_bytes)
        return sha256.hexdigest()

    async def save_evidence(
        self,
        complaint_id: int,
        user: User,
        file: UploadFile,
        category: str,
        notes: str = None
    ) -> Evidence:
        # Validate complaint
        complaint = self.db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")

        # Validate extension
        filename = file.filename or "evidence_file"
        _, ext = os.path.splitext(filename)
        ext = ext.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        content = await file.read()
        file_size = len(content)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit")

        sha256_hash = self.calculate_sha256(content)

        # Save to disk with unique hashed filename
        saved_name = f"comp_{complaint_id}_{sha256_hash[:16]}{ext}"
        saved_path = os.path.join(UPLOAD_DIR, saved_name)
        with open(saved_path, "wb") as f:
            f.write(content)

        evidence = Evidence(
            complaint_id=complaint_id,
            uploader_id=user.id,
            file_name=filename,
            file_path=saved_path,
            file_size=file_size,
            file_type=ext.replace(".", "").upper(),
            category=category,
            sha256_hash=sha256_hash,
            notes=notes
        )
        self.db.add(evidence)
        self.db.commit()
        self.db.refresh(evidence)

        # Log audit trail
        log_audit_event(
            self.db,
            action="EVIDENCE_UPLOADED",
            resource_type="Evidence",
            resource_id=str(evidence.id),
            details=f"File: {filename}, SHA-256: {sha256_hash}, Category: {category}",
            user_id=user.id
        )

        return evidence

    def verify_integrity(self, evidence_id: int, user: User) -> dict:
        evidence = self.db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not evidence:
            raise HTTPException(status_code=404, detail="Evidence record not found")

        if not os.path.exists(evidence.file_path):
            return {
                "evidence_id": evidence_id,
                "verified": False,
                "status": "MISSING_ON_DISK",
                "message": "Physical file missing on server storage"
            }

        with open(evidence.file_path, "rb") as f:
            current_bytes = f.read()

        current_hash = self.calculate_sha256(current_bytes)
        is_valid = (current_hash == evidence.sha256_hash)

        log_audit_event(
            self.db,
            action="EVIDENCE_INTEGRITY_VERIFIED",
            resource_type="Evidence",
            resource_id=str(evidence.id),
            details=f"Verification result: {'PASS' if is_valid else 'FAIL'}",
            user_id=user.id
        )

        return {
            "evidence_id": evidence_id,
            "file_name": evidence.file_name,
            "stored_hash": evidence.sha256_hash,
            "computed_hash": current_hash,
            "is_tamper_free": is_valid,
            "verified_at": str(datetime.utcnow())
        }

