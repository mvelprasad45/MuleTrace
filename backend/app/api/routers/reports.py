import os
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ...database.session import get_db
from ...models.investigation_report import InvestigationReport
from ...services.report_service import ReportService
from ..deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Investigation Reports"])

@router.post("/generate")
def generate_report(
    complaint_id: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ReportService(db)
    try:
        report = service.generate_complaint_report(complaint_id, current_user)
        return {
            "id": report.id,
            "report_number": report.report_number,
            "title": report.title,
            "complaint_id": report.complaint_id,
            "pdf_url": f"/api/reports/download/{report.id}",
            "created_at": report.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation error: {str(e)}")

@router.get("")
def list_reports(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    reports = db.query(InvestigationReport).order_by(InvestigationReport.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "report_number": r.report_number,
            "complaint_id": r.complaint_id,
            "complaint_number": r.complaint.complaint_number if r.complaint else f"COMP-{r.complaint_id}",
            "title": r.title,
            "investigator_name": r.investigator.full_name if r.investigator else "Officer",
            "pdf_url": f"/api/reports/download/{r.id}",
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for r in reports
    ]

@router.get("/download/{report_id}")
def download_report(report_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    report = db.query(InvestigationReport).filter(InvestigationReport.id == report_id).first()
    if not report or not os.path.exists(report.pdf_path):
        raise HTTPException(status_code=404, detail="Report file not found")

    return FileResponse(
        path=report.pdf_path,
        filename=os.path.basename(report.pdf_path),
        media_type="application/pdf"
    )

