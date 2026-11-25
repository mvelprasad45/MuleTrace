import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session
from ..models.complaint import Complaint
from ..models.investigation_report import InvestigationReport
from ..models.user import User
from ..algorithms.graph_engine import MoneyTrailGraphEngine
from ..algorithms.detection_engine import SuspiciousDetectionEngine
from ..api.deps import log_audit_event

REPORTS_DIR = os.getenv("REPORTS_DIR", "uploads/reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_watermark()
            self.draw_header_footer(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_watermark(self):
        self.saveState()
        self.setFont("Helvetica-Bold", 55)
        self.setFillColor(colors.HexColor("#00F5D4"), alpha=0.07)
        self.translate(300, 400)
        self.rotate(45)
        self.drawCentredString(0, 0, "MULETRACE - DEMO DATA")
        self.restoreState()

    def draw_header_footer(self, page_count):
        self.saveState()
        # Header line
        self.setStrokeColor(colors.HexColor("#00F5D4"))
        self.setLineWidth(1)
        self.line(36, 756, 576, 756)
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#334155"))
        self.drawString(36, 762, "MULETRACE CYBERCRIME INTELLIGENCE COMMAND // OFFICIAL INVESTIGATION DOSSIER")
        
        # Footer
        self.line(36, 45, 576, 45)
        self.setFont("Helvetica", 8)
        self.drawString(36, 32, "CONFIDENTIAL // FOR AUTHORIZED LAW ENFORCEMENT & COMPLIANCE USE ONLY")
        self.drawRightString(576, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def generate_complaint_report(self, complaint_id: int, investigator: User) -> InvestigationReport:
        complaint = self.db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise ValueError("Complaint not found")

        # Run money trail graph extraction
        graph_engine = MoneyTrailGraphEngine(self.db)
        trail = graph_engine.trace_money_trail(complaint=complaint, max_depth=5)

        # Generate unique report number
        report_num = f"REP-{datetime.utcnow().year}-{1000 + complaint.id}"
        filename = f"{report_num}_Dossier.pdf"
        file_path = os.path.join(REPORTS_DIR, filename)

        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=54,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#475569'),
            spaceAfter=15
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#0284C7'),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#1E293B')
        )
        lead_style = ParagraphStyle(
            'LeadBody',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#DC2626')
        )

        elements = []

        # 1. Dossier Header
        elements.append(Paragraph("FINANCIAL CYBERCRIME NETWORK INVESTIGATION REPORT", title_style))
        elements.append(Paragraph(
            f"REPORT ID: <b>{report_num}</b> | DATE: <b>{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</b> | INVESTIGATOR: <b>{investigator.full_name} ({investigator.badge_number or 'CCU-INV'})</b>",
            subtitle_style
        ))
        elements.append(Spacer(1, 8))

        # 2. Complaint & Victim Information Table
        elements.append(Paragraph("1. COMPLAINT & VICTIM SUMMARY", h2_style))
        comp_data = [
            ["Complaint ID:", complaint.complaint_number, "Status / Priority:", f"{complaint.status} / {complaint.priority}"],
            ["Victim Name:", complaint.victim_name, "Victim Contact:", complaint.victim_mobile],
            ["Victim Bank:", complaint.bank_name, "Remitter Account:", complaint.masked_account_number],
            ["Defrauded Amount:", f"₹{complaint.amount:,.2f}", "Incident Date & Time:", f"{complaint.transaction_date} {complaint.transaction_time}"],
            ["Transaction UTR:", complaint.utr_number, "Suspected Entity:", complaint.suspected_upi_id or complaint.suspected_account_number or "N/A"]
        ]
        t_comp = Table(comp_data, colWidths=[100, 170, 100, 170])
        t_comp.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#0F172A')),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ]))
        elements.append(t_comp)
        elements.append(Spacer(1, 10))

        # 3. Fraud Incident Synopsis
        elements.append(Paragraph("2. FRAUD INCIDENT DESCRIPTION", h2_style))
        elements.append(Paragraph(complaint.fraud_description, body_style))
        elements.append(Spacer(1, 10))

        # 4. Money Trail & Layering Summary
        elements.append(Paragraph("3. MONEY TRAIL GRAPH TRACING & HOP BREAKDOWN", h2_style))
        trail_meta = [
            ["Traced Network Nodes:", str(len(trail["nodes"])), "Traced Directed Edges:", str(len(trail["edges"]))],
            ["Maximum Layering Depth:", f"{trail['max_depth']} Hops", "Total Traced Fund Flow:", f"₹{trail['total_traced_amount']:,.2f}"]
        ]
        t_meta = Table(trail_meta, colWidths=[130, 140, 130, 140])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t_meta)
        elements.append(Spacer(1, 8))

        # 5. Connected Bank Accounts Table
        elements.append(Paragraph("4. CONNECTED BANK ACCOUNTS (INVESTIGATION LEADS)", h2_style))
        acc_headers = [["Node ID", "Bank Name", "Masked Account", "Risk Score", "Risk Category", "Role / State"]]
        for node in trail["nodes"][:12]:
            acc_headers.append([
                node["id"],
                node["bank_name"],
                node["masked_account"],
                f"{node['risk_score']:.1f}",
                node["risk_category"],
                f"{node['node_type']} {'[FROZEN]' if node['is_frozen'] else ''}"
            ])
        t_acc = Table(acc_headers, colWidths=[45, 125, 120, 60, 80, 110])
        t_acc.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 7.5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ]))
        elements.append(t_acc)
        elements.append(Spacer(1, 10))

        # 6. Suspicious Detection Patterns
        elements.append(Paragraph("5. DETECTED SUSPICIOUS PATTERNS & VELOCITY ANOMALIES", h2_style))
        if trail["suspicious_patterns"]:
            pat_data = [["Pattern Code", "From Account", "To Account", "Transferred Amount", "Velocity / Pass-Through"]]
            for p in trail["suspicious_patterns"]:
                pat_data.append([
                    p.get("pattern", "RAPID_MONEY_MOVEMENT"),
                    str(p.get("from_account")),
                    str(p.get("to_account")),
                    f"₹{p.get('amount', 0):,.2f}",
                    f"Completed in {p.get('duration_mins')} mins"
                ])
            t_pat = Table(pat_data, colWidths=[130, 95, 95, 100, 120])
            t_pat.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#991B1B')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 7.5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                ('TOPPADDING', (0,0), (-1,-1), 3),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ]))
            elements.append(t_pat)
        else:
            elements.append(Paragraph("No rapid transit or high-velocity anomalies identified for initial hop.", body_style))
        elements.append(Spacer(1, 10))

        # 7. Evidence Records & Cryptographic SHA-256 Hashes
        elements.append(Paragraph("6. DIGITAL EVIDENCE VAULT (SHA-256 INTEGRITY LOG)", h2_style))
        evidences = complaint.evidences
        if evidences:
            ev_data = [["Evidence ID", "Category", "Filename", "File Size", "SHA-256 Verification Hash"]]
            for ev in evidences:
                ev_data.append([
                    f"EV-{ev.id}",
                    ev.category,
                    ev.file_name[:20],
                    f"{ev.file_size / 1024:.1f} KB",
                    f"{ev.sha256_hash[:20]}..."
                ])
            t_ev = Table(ev_data, colWidths=[60, 110, 110, 60, 200])
            t_ev.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 7.5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                ('TOPPADDING', (0,0), (-1,-1), 3),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ]))
            elements.append(t_ev)
        else:
            elements.append(Paragraph("No digital evidence files attached to this complaint yet.", body_style))
        elements.append(Spacer(1, 12))

        # 8. Investigator Sign-off & Legal Notice
        elements.append(Paragraph("7. INVESTIGATIVE OBSERVATIONS & ACTIONS RECOMMENDED", h2_style))
        elements.append(Paragraph(
            "<b>LEAD RECOMMENDATION:</b> Rapid debit freeze notices (under Section 91 CrPC / IT Act) are recommended for Tier-1 and Tier-2 mule accounts identified with risk score >= 70.0. "
            "Algorithms identify statistical anomalies; field verification and bank KYC inspection are mandated prior to judicial indictment.",
            lead_style
        ))
        elements.append(Spacer(1, 25))

        sign_data = [
            ["_____________________________________", "_____________________________________"],
            [f"Investigating Officer: {investigator.full_name}", "Superintendent / CCU Chief Examiner"],
            [f"Badge: {investigator.badge_number or 'INV-CYBER-880'}", "Cyber Crime Division, HQ"]
        ]
        t_sign = Table(sign_data, colWidths=[270, 270])
        t_sign.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#334155')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ]))
        elements.append(KeepTogether(t_sign))

        # Build PDF with custom NumberedCanvas
        doc.build(elements, canvasmaker=NumberedCanvas)

        # Record in DB
        report = InvestigationReport(
            report_number=report_num,
            complaint_id=complaint.id,
            investigator_id=investigator.id,
            title=f"Money Trail Forensic Dossier - {complaint.complaint_number}",
            pdf_path=file_path,
            summary=f"Automated forensic dossier generated for complaint {complaint.complaint_number} tracing ₹{complaint.amount:,.2f} across {len(trail['nodes'])} accounts."
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)

        log_audit_event(
            self.db,
            action="REPORT_GENERATED",
            resource_type="InvestigationReport",
            resource_id=report_num,
            details=f"Dossier PDF compiled for complaint {complaint.complaint_number}",
            user_id=investigator.id
        )

        return report

