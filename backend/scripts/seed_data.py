import os
import sys
from datetime import datetime, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import Base, get_engine, SessionLocal
from app.models.user import User, UserRole
from app.models.bank_account import BankAccount
from app.models.transaction import Transaction
from app.models.complaint import Complaint
from app.models.investigation_note import InvestigationNote
from app.utils.security import get_password_hash
from app.algorithms.detection_engine import SuspiciousDetectionEngine
from app.algorithms.linked_detector import LinkedComplaintDetector

def seed_database():
    print("[MULETRACE-SEED] Initializing database schema...")
    engine = get_engine()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    print("[MULETRACE-SEED] Seeding system users...")

    # 1. System Users
    admin_user = User(
        email="admin@muletrace.gov.in",
        hashed_password=get_password_hash("Admin@CyberTrace2026"),
        full_name="Rajesh Kumar Verma",
        badge_number="CCU-DIR-001",
        role=UserRole.ADMIN.value,
        department="Central Financial Intelligence & Cyber Division"
    )
    officer_user = User(
        email="officer@muletrace.gov.in",
        hashed_password=get_password_hash("Officer@MuleTrace2026"),
        full_name="Pooja Sharma",
        badge_number="CCU-INV-442",
        role=UserRole.INVESTIGATOR.value,
        department="Mule Network Rapid Action Wing"
    )
    db.add_all([admin_user, officer_user])
    db.commit()

    print("[MULETRACE-SEED] Seeding bank accounts...")

    # 2. Bank Accounts (Victims, Mule Tier 1, Mule Tier 2, Mule Tier 3, Cashouts)
    # Scenario:
    # Victim A (1) -> Account A (Mule 1, id 4)
    # Account A (4) -> Account B (id 5), Account C (id 6), Account D (id 7)
    # Account B (5) -> Account E (id 8)
    # Account C (6) -> Account F (id 9)
    # Account D (7) -> Account G (id 10)
    # Victim B (2) -> Account H (Mule Tier 1, id 11) -> Account C (id 6) [CROSS-COMPLAINT CONVERGENCE POINT!]
    # Circular Ring: Account D (7) -> Account I (12) -> Account J (13) -> Account D (7)
    # Shared Synthetic Device ID: Account C (6), Account K (14), Account L (15) share "DEV-MULE-SHA-984"

    accounts_data = [
        # Victims
        {"id": 1, "acc": "50100492819201", "masked": "501004XXXX01", "bank": "HDFC Bank", "ifsc": "HDFC0001234", "name": "Aditya Roy (Victim A)", "type": "Savings", "risk": 0.0, "cat": "Low", "device": "DEV-LEGIT-101", "city": "Bengaluru"},
        {"id": 2, "acc": "60200847291022", "masked": "602008XXXX22", "bank": "State Bank of India", "ifsc": "SBIN0004582", "name": "Sunita Deshmukh (Victim B)", "type": "Savings", "risk": 0.0, "cat": "Low", "device": "DEV-LEGIT-102", "city": "Pune"},
        {"id": 3, "acc": "70300184729303", "masked": "703001XXXX03", "bank": "ICICI Bank", "ifsc": "ICIC0000982", "name": "Vikram Sethi (Victim C)", "type": "Salary", "risk": 0.0, "cat": "Low", "device": "DEV-LEGIT-103", "city": "Delhi"},

        # Primary Transit Mule (Account A)
        {"id": 4, "acc": "91827364501904", "masked": "918273XXXX04", "bank": "Kotak Mahindra Bank", "ifsc": "KKBK0000431", "name": "Ramesh Kumar (Account A - Mule 1)", "type": "Current", "risk": 88.0, "cat": "Critical", "device": "DEV-MULE-HUB-01", "city": "Surat"},

        # Tier 2 Layering Mules (Accounts B, C, D)
        {"id": 5, "acc": "34918273645005", "masked": "349182XXXX05", "bank": "Axis Bank", "ifsc": "UTIB0000214", "name": "Deepak Patel (Account B)", "type": "Savings", "risk": 78.0, "cat": "High", "device": "DEV-MULE-SEC-02", "city": "Ahmedabad"},
        {"id": 6, "acc": "81726354901806", "masked": "817263XXXX06", "bank": "Punjab National Bank", "ifsc": "PUNB0182700", "name": "Imran Sheikh (Account C - Convergence Node)", "type": "Current", "risk": 96.0, "cat": "Critical", "device": "DEV-MULE-SHA-984", "city": "Mumbai"},
        {"id": 7, "acc": "19283746501207", "masked": "192837XXXX07", "bank": "Canara Bank", "ifsc": "CNRB0002918", "name": "Manish Tiwari (Account D - Ring Leader)", "type": "Savings", "risk": 84.0, "cat": "Critical", "device": "DEV-MULE-RING-01", "city": "Indore"},

        # Tier 3 Layering / Cashout Mules
        {"id": 8, "acc": "48291038472108", "masked": "482910XXXX08", "bank": "Bank of Baroda", "ifsc": "BARB0SURATM", "name": "Sanjay Verma (Account E)", "type": "Savings", "risk": 68.0, "cat": "High", "device": "DEV-MULE-FIN-01", "city": "Vadodara"},
        {"id": 9, "acc": "59201948271009", "masked": "592019XXXX09", "bank": "Union Bank of India", "ifsc": "UBIN0549281", "name": "Naveen Rao (Account F)", "type": "Savings", "risk": 72.0, "cat": "High", "device": "DEV-MULE-FIN-02", "city": "Nagpur"},
        {"id": 10, "acc": "68392019482010", "masked": "683920XXXX10", "bank": "Yes Bank", "ifsc": "YESB0000192", "name": "Farhan Qureshi (Account G - Crypto On-ramp)", "type": "Current", "risk": 82.0, "cat": "Critical", "device": "DEV-CASHOUT-CRYPTO", "city": "Mumbai"},

        # Feeder Mule for Victim B
        {"id": 11, "acc": "74829103847211", "masked": "748291XXXX11", "bank": "Federal Bank", "ifsc": "FDRL0001827", "name": "Aakash Gupta (Account H - Transit 2)", "type": "Savings", "risk": 76.0, "cat": "High", "device": "DEV-MULE-HUB-02", "city": "Jaipur"},

        # Circular Ring Accounts (connected with Account D #7)
        {"id": 12, "acc": "83920194827112", "masked": "839201XXXX12", "bank": "IndusInd Bank", "ifsc": "INDB0000918", "name": "Karan Malhotra (Account I - Ring 2)", "type": "Savings", "risk": 85.0, "cat": "Critical", "device": "DEV-RING-NODE-02", "city": "Bhopal"},
        {"id": 13, "acc": "92019482710313", "masked": "920194XXXX13", "bank": "IDFC FIRST Bank", "ifsc": "IDFB0040182", "name": "Gaurav Joshi (Account J - Ring 3)", "type": "Current", "risk": 86.0, "cat": "Critical", "device": "DEV-RING-NODE-03", "city": "Ujjain"},

        # Shared Device Accounts (sharing DEV-MULE-SHA-984 with Account C #6)
        {"id": 14, "acc": "10293847561014", "masked": "102938XXXX14", "bank": "RBL Bank", "ifsc": "RATN0000281", "name": "Kailash Choudhary (Account K - Shared Device)", "type": "Savings", "risk": 74.0, "cat": "High", "device": "DEV-MULE-SHA-984", "city": "Mumbai"},
        {"id": 15, "acc": "21094837261915", "masked": "210948XXXX15", "bank": "Bandhan Bank", "ifsc": "BDBL0001928", "name": "Tariq Siddiqui (Account L - Shared Device)", "type": "Savings", "risk": 75.0, "cat": "High", "device": "DEV-MULE-SHA-984", "city": "Thane"},

        # Additional synthetic peripheral accounts for volume & graph density
        {"id": 16, "acc": "32109485726116", "masked": "321094XXXX16", "bank": "HDFC Bank", "ifsc": "HDFC0004918", "name": "Preeti Nair", "type": "Savings", "risk": 20.0, "cat": "Low", "device": "DEV-GEN-01", "city": "Kochi"},
        {"id": 17, "acc": "43210958637217", "masked": "432109XXXX17", "bank": "Axis Bank", "ifsc": "UTIB0001092", "name": "Mohit Bansal", "type": "Current", "risk": 45.0, "cat": "Medium", "device": "DEV-GEN-02", "city": "Delhi"},
        {"id": 18, "acc": "54321069748318", "masked": "543210XXXX18", "bank": "State Bank of India", "ifsc": "SBIN0008472", "name": "Sneha Roy", "type": "Savings", "risk": 15.0, "cat": "Low", "device": "DEV-GEN-03", "city": "Kolkata"},
        {"id": 19, "acc": "65432170859419", "masked": "654321XXXX19", "bank": "ICICI Bank", "ifsc": "ICIC0003829", "name": "Rajiv Mehra", "type": "Salary", "risk": 25.0, "cat": "Low", "device": "DEV-GEN-04", "city": "Chandigarh"},
        {"id": 20, "acc": "76543281960520", "masked": "765432XXXX20", "bank": "Kotak Mahindra Bank", "ifsc": "KKBK0001920", "name": "Tanvi Joshi", "type": "Savings", "risk": 18.0, "cat": "Low", "device": "DEV-GEN-05", "city": "Bengaluru"}
    ]

    for a in accounts_data:
        acc_obj = BankAccount(
            id=a["id"],
            account_number=a["acc"],
            masked_account_number=a["masked"],
            bank_name=a["bank"],
            ifsc_code=a["ifsc"],
            account_holder_name=a["name"],
            account_type=a["type"],
            upi_id=f"{a['name'].split()[0].lower()}@{a['bank'].split()[0].lower()}pay",
            device_id=a["device"],
            ip_address=f"103.24.{10 + a['id']}.88",
            branch_city=a["city"],
            risk_score=a["risk"],
            risk_category=a["cat"],
            is_frozen=False
        )
        db.add(acc_obj)
    db.commit()

    print("[MULETRACE-SEED] Seeding transactions...")

    # Base time for incident sequence (2 hours ago)
    t0 = datetime.utcnow() - timedelta(hours=4)

    transactions_data = [
        # SCENARIO STEP 1: Victim A sends ₹50,000 to Account A
        {"utr": "UTR20261124800101", "from": 1, "to": 4, "amt": 50000.0, "time": t0, "type": "IMPS", "remarks": "Electricity Bill Payment Fraud"},

        # SCENARIO STEP 2: Rapid pass-through / Fan-out from Account A to B, C, D within 12 mins!
        {"utr": "UTR20261124800102", "from": 4, "to": 5, "amt": 16000.0, "time": t0 + timedelta(minutes=4), "type": "IMPS", "remarks": "Immediate Transfer P2P"},
        {"utr": "UTR20261124800103", "from": 4, "to": 6, "amt": 18000.0, "time": t0 + timedelta(minutes=7), "type": "IMPS", "remarks": "Urgent vendor settlement"},
        {"utr": "UTR20261124800104", "from": 4, "to": 7, "amt": 15000.0, "time": t0 + timedelta(minutes=11), "type": "IMPS", "remarks": "Consultancy payout"},

        # SCENARIO STEP 3: Downstream transfers to Tier 3 (E, F, G)
        {"utr": "UTR20261124800105", "from": 5, "to": 8, "amt": 15500.0, "time": t0 + timedelta(minutes=22), "type": "UPI", "remarks": "Quick settlement"},
        {"utr": "UTR20261124800106", "from": 6, "to": 9, "amt": 17200.0, "time": t0 + timedelta(minutes=28), "type": "UPI", "remarks": "Material purchase"},
        {"utr": "UTR20261124800107", "from": 7, "to": 10, "amt": 14000.0, "time": t0 + timedelta(minutes=35), "type": "NEFT", "remarks": "Crypto exchange escrow deposit"},

        # SCENARIO STEP 4: VICTIM B INCIDENT (Cross-Complaint Convergence on Account C #6!)
        {"utr": "UTR20261124800201", "from": 2, "to": 11, "amt": 75000.0, "time": t0 + timedelta(minutes=15), "type": "RTGS", "remarks": "Digital Arrest Extortion"},
        {"utr": "UTR20261124800202", "from": 11, "to": 6, "amt": 72000.0, "time": t0 + timedelta(minutes=24), "type": "IMPS", "remarks": "Legal clearance escrow -> Converges on Account C!"},

        # SCENARIO STEP 5: CIRCULAR TRANSACTION RING (Account D #7 -> I #12 -> J #13 -> D #7)
        {"utr": "UTR20261124800301", "from": 7, "to": 12, "amt": 25000.0, "time": t0 + timedelta(minutes=45), "type": "IMPS", "remarks": "Inter-account loan tranche 1"},
        {"utr": "UTR20261124800302", "from": 12, "to": 13, "amt": 24500.0, "time": t0 + timedelta(minutes=55), "type": "IMPS", "remarks": "Inter-account loan tranche 2"},
        {"utr": "UTR20261124800303", "from": 13, "to": 7, "amt": 24000.0, "time": t0 + timedelta(minutes=70), "type": "IMPS", "remarks": "Re-injected fund wash return"},

        # Additional multi-hop and feeder transactions
        {"utr": "UTR20261124800401", "from": 3, "to": 14, "amt": 35000.0, "time": t0 + timedelta(minutes=40), "type": "UPI", "remarks": "FedEx Courier parcel scam"},
        {"utr": "UTR20261124800402", "from": 14, "to": 15, "amt": 33000.0, "time": t0 + timedelta(minutes=52), "type": "UPI", "remarks": "Shared device transfer to Tariq"},
        {"utr": "UTR20261124800403", "from": 15, "to": 6, "amt": 31000.0, "time": t0 + timedelta(minutes=68), "type": "IMPS", "remarks": "Further convergence on Account C"},

        # Peripheral normal flow transactions
        {"utr": "UTR20261124800501", "from": 16, "to": 17, "amt": 8500.0, "time": t0 - timedelta(hours=12), "type": "UPI", "remarks": "Rent settlement"},
        {"utr": "UTR20261124800502", "from": 17, "to": 18, "amt": 4200.0, "time": t0 - timedelta(hours=8), "type": "IMPS", "remarks": "Groceries transfer"},
        {"utr": "UTR20261124800503", "from": 18, "to": 19, "amt": 12000.0, "time": t0 - timedelta(hours=5), "type": "NEFT", "remarks": "Tuition fees"},
        {"utr": "UTR20261124800504", "from": 19, "to": 20, "amt": 9500.0, "time": t0 - timedelta(hours=2), "type": "UPI", "remarks": "Electronics refund"}
    ]

    for t in transactions_data:
        txn_obj = Transaction(
            utr_number=t["utr"],
            from_account_id=t["from"],
            to_account_id=t["to"],
            amount=t["amt"],
            transaction_date=t["time"],
            transaction_type=t["type"],
            status="Completed",
            channel="Mobile Banking App",
            remarks=t["remarks"]
        )
        db.add(txn_obj)
    db.commit()

    print("[MULETRACE-SEED] Seeding complaints...")

    # 3. Complaints
    complaints_data = [
        {
            "num": "COMP-2026-1001",
            "victim": "Aditya Roy",
            "phone": "+91 98201 44821",
            "bank": "HDFC Bank",
            "masked": "501004XXXX01",
            "utr": "UTR20261124800101",
            "amt": 50000.0,
            "date": (t0).strftime("%Y-%m-%d"),
            "time": (t0).strftime("%H:%M:%S"),
            "upi": "quickbill@kotakpay",
            "acc": "91827364501904",
            "desc": "Victim received an SMS claiming electricity power supply would be disconnected due to unpaid bill. Clicked malicious link and authorised an urgent IMPS transaction of ₹50,000 to suspected Kotak account.",
            "status": "Under Investigation",
            "priority": "Critical"
        },
        {
            "num": "COMP-2026-1002",
            "victim": "Sunita Deshmukh",
            "phone": "+91 97654 32189",
            "bank": "State Bank of India",
            "masked": "602008XXXX22",
            "utr": "UTR20261124800201",
            "amt": 75000.0,
            "date": (t0 + timedelta(minutes=15)).strftime("%Y-%m-%d"),
            "time": (t0 + timedelta(minutes=15)).strftime("%H:%M:%S"),
            "upi": "cbi.clearance@federalpay",
            "acc": "74829103847211",
            "desc": "Victim was subjected to a coercive 'Digital Arrest' impersonation scam by callers posing as Telecom Regulatory and CBI officials. Compelled to transfer ₹75,000 for verification into alleged government escrow account.",
            "status": "Escalated",
            "priority": "Critical"
        },
        {
            "num": "COMP-2026-1003",
            "victim": "Vikram Sethi",
            "phone": "+91 99112 55430",
            "bank": "ICICI Bank",
            "masked": "703001XXXX03",
            "utr": "UTR20261124800401",
            "amt": 35000.0,
            "date": (t0 + timedelta(minutes=40)).strftime("%Y-%m-%d"),
            "time": (t0 + timedelta(minutes=40)).strftime("%H:%M:%S"),
            "upi": "customs.clearance@rblpay",
            "acc": "10293847561014",
            "desc": "Fraudster posing as international courier logistics agent demanded custom penalty fee for foreign consignment containing valuable gift.",
            "status": "New",
            "priority": "High"
        },
        {
            "num": "COMP-2026-1004",
            "victim": "Priya Nair",
            "phone": "+91 94471 20983",
            "bank": "Canara Bank",
            "masked": "301928XXXX11",
            "utr": "UTR20261124800501",
            "amt": 28000.0,
            "date": "2026-11-23",
            "time": "14:20:10",
            "upi": "parttime.earn@axispay",
            "acc": "34918273645005",
            "desc": "Victim lured into high-yield Telegram crypto rating task job. Paid ₹28,000 processing fees before platform blocked withdrawal.",
            "status": "Evidence Required",
            "priority": "Medium"
        },
        {
            "num": "COMP-2026-1005",
            "victim": "Harish Patel",
            "phone": "+91 98980 12764",
            "bank": "Kotak Mahindra Bank",
            "masked": "918201XXXX88",
            "utr": "UTR20261124800301",
            "amt": 45000.0,
            "date": "2026-11-22",
            "time": "11:05:44",
            "upi": "instantloan@yespay",
            "acc": "19283746501207",
            "desc": "Victim trapped in instant predatory micro-loan application harassment scam. Extorted through contact list scraping threat.",
            "status": "Closed",
            "priority": "Low"
        }
    ]

    for c in complaints_data:
        comp_obj = Complaint(
            complaint_number=c["num"],
            victim_name=c["victim"],
            victim_mobile=c["phone"],
            bank_name=c["bank"],
            masked_account_number=c["masked"],
            utr_number=c["utr"],
            amount=c["amt"],
            transaction_date=c["date"],
            transaction_time=c["time"],
            suspected_upi_id=c["upi"],
            suspected_account_number=c["acc"],
            fraud_description=c["desc"],
            status=c["status"],
            priority=c["priority"],
            assigned_investigator_id=officer_user.id
        )
        db.add(comp_obj)
    db.commit()

    # Add investigative note
    note1 = InvestigationNote(
        complaint_id=1,
        author_id=officer_user.id,
        note_text="Primary suspect account 918273XXXX04 has dispersed ₹50,000 within 12 minutes to 3 distinct second-tier beneficiary accounts. Section 91 CrPC notice dispatched to Kotak Nodal Officer.",
        is_lead=True
    )
    db.add(note1)
    db.commit()

    print("[MULETRACE-SEED] Running Fraud Detection & Linked Complaint Engine...")
    detection_engine = SuspiciousDetectionEngine(db)
    detection_engine.run_full_scan()

    linked_detector = LinkedComplaintDetector(db)
    links = linked_detector.detect_linked_complaints()
    print(f"[MULETRACE-SEED] Linked complaints detected: {len(links)}")

    print("[MULETRACE-SEED] Complete! Synthetic fraud network seeded successfully.")
    db.close()

if __name__ == "__main__":
    seed_database()

