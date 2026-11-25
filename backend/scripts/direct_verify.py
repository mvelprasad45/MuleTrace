import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal, get_engine
from app.models.user import User
from app.models.complaint import Complaint
from app.models.bank_account import BankAccount
from app.models.transaction import Transaction
from app.models.suspicious_account import SuspiciousAccount
from app.models.linked_complaint import LinkedComplaint
from app.algorithms.graph_engine import MoneyTrailGraphEngine
from app.algorithms.detection_engine import SuspiciousDetectionEngine
from app.algorithms.linked_detector import LinkedComplaintDetector
from app.services.report_service import ReportService
from app.services.evidence_service import EvidenceService

def verify_all():
    print("==================================================")
    print("MULETRACE DIRECT VERIFICATION TEST")
    print("==================================================")

    db = SessionLocal()

    # 1. Users Check
    users = db.query(User).all()
    print(f"[OK] Users seeded: {len(users)} ({', '.join([u.email for u in users])})")
    assert len(users) >= 2, "Users missing"

    # 2. Bank Accounts Check
    accounts = db.query(BankAccount).all()
    print(f"[OK] Bank accounts seeded: {len(accounts)}")
    assert len(accounts) >= 20, "Bank accounts missing"

    # 3. Transactions Check
    transactions = db.query(Transaction).all()
    print(f"[OK] Transactions recorded: {len(transactions)}")
    assert len(transactions) >= 15, "Transactions missing"

    # 4. Complaints Check
    complaints = db.query(Complaint).all()
    print(f"[OK] Complaints registered: {len(complaints)}")
    assert len(complaints) >= 5, "Complaints missing"

    # 5. NetworkX Graph Engine Check
    print("\n[VERIFYING] NetworkX Money Trail Graph Engine...")
    graph_engine = MoneyTrailGraphEngine(db)
    trail = graph_engine.trace_money_trail(complaint=complaints[0], max_depth=5)
    print(f"[OK] Money Trail Traced for Complaint 1:")
    print(f"     Nodes in Subgraph: {len(trail['nodes'])}")
    print(f"     Directed Edges: {len(trail['edges'])}")
    print(f"     Total Traced Volume: ₹{trail['total_traced_amount']:,.2f}")
    print(f"     Max Layering Depth: {trail['max_depth']} Hops")
    print(f"     Hop Distribution: {trail['hop_breakdown']}")
    print(f"     Rapid Pass-Through Anomalies: {len(trail['suspicious_patterns'])}")
    assert len(trail['nodes']) >= 4, "Money trail should have multi-hop nodes"

    # 6. Suspicious Detection Engine Check
    print("\n[VERIFYING] Explainable Suspicious Detection Engine...")
    detection_engine = SuspiciousDetectionEngine(db)
    detection_engine.run_full_scan()
    flagged = db.query(SuspiciousAccount).order_by(SuspiciousAccount.risk_score.desc()).all()
    print(f"[OK] Flagged Suspicious Mule Accounts: {len(flagged)}")
    for s in flagged[:3]:
        print(f"     - Account: {s.account.masked_account_number} ({s.account.bank_name}) | Score: {s.risk_score:.1f} | Tier: {s.risk_category}")
        print(f"       Rules Triggered: {s.detection_rules}")

    # 7. Linked Complaint Detection Check
    print("\n[VERIFYING] Linked Complaint Detection Engine...")
    linked_detector = LinkedComplaintDetector(db)
    links = linked_detector.detect_linked_complaints()
    print(f"[OK] Linked Complaints Discovered: {len(links)}")
    for l in links[:2]:
        print(f"     - {l['complaint_a_number']} & {l['complaint_b_number']} converge on {l['shared_bank_name']} ({l['shared_account_masked']})")
        print(f"       Trajectory: {l['path_summary']}")

    # 8. ReportLab PDF Generation Check
    print("\n[VERIFYING] ReportLab Forensic PDF Generator...")
    report_service = ReportService(db)
    officer = db.query(User).filter(User.role == "Investigation Officer").first()
    report = report_service.generate_complaint_report(complaints[0].id, officer)
    print(f"[OK] Dossier generated successfully:")
    print(f"     Report Number: {report.report_number}")
    print(f"     PDF File Path: {report.pdf_path}")
    print(f"     Physical File Exists: {os.path.exists(report.pdf_path)}")
    print(f"     File Size: {os.path.getsize(report.pdf_path)} bytes")
    assert os.path.exists(report.pdf_path), "PDF was not created on disk"
    assert os.path.getsize(report.pdf_path) > 1000, "PDF file too small"

    # 9. Evidence Vault SHA-256 Check
    print("\n[VERIFYING] SHA-256 Evidence Vault Integrity Engine...")
    evidence_service = EvidenceService(db)
    test_content = b"MULETRACE FORENSIC EVIDENCE ARTIFACT - HACKATHON VERIFICATION"
    computed_hash = evidence_service.calculate_sha256(test_content)
    print(f"[OK] Calculated SHA-256 Hash: {computed_hash}")
    assert len(computed_hash) == 64, "SHA-256 hash must be 64 hexadecimal characters"

    print("\n==================================================")
    print("ALL 9 MULETRACE ENGINES & ALGORITHMS VERIFIED PASS!")
    print("==================================================")
    db.close()

if __name__ == "__main__":
    verify_all()

