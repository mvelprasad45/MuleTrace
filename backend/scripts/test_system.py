import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database.session import SessionLocal
from app.models.complaint import Complaint

class TestMuleTraceSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ok")
        print("[TEST-PASS] Health check verified.")

    def test_02_auth_login(self):
        res = self.client.post("/api/auth/login", json={
            "email": "officer@muletrace.gov.in",
            "password": "Officer@MuleTrace2026"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.__class__.token = data["access_token"]
        print("[TEST-PASS] Authentication & JWT generation verified.")

    def test_03_dashboard_stats(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        res = self.client.get("/api/dashboard/stats", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total_complaints"], 5)
        self.assertGreaterEqual(data["transactions_analysed"], 15)
        print(f"[TEST-PASS] Dashboard stats verified. Total complaints: {data['total_complaints']}, Traced txns: {data['transactions_analysed']}")

    def test_04_complaints_list(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        res = self.client.get("/api/complaints", headers=headers)
        self.assertEqual(res.status_code, 200)
        complaints = res.json()
        self.assertGreaterEqual(len(complaints), 5)
        self.assertEqual(complaints[0]["complaint_number"], "COMP-2026-1001")
        print(f"[TEST-PASS] Complaints list verified ({len(complaints)} complaints retrieved).")

    def test_05_money_trail_tracing(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        res = self.client.get("/api/trace/1", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data["nodes"]), 3)
        self.assertGreater(len(data["edges"]), 2)
        self.assertGreater(data["total_traced_amount"], 0)
        print(f"[TEST-PASS] Money trail tracing verified. Traced nodes: {len(data['nodes'])}, edges: {len(data['edges'])}, amount: ₹{data['total_traced_amount']:,.2f}")

    def test_06_suspicious_accounts_engine(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        res = self.client.get("/api/accounts/suspicious", headers=headers)
        self.assertEqual(res.status_code, 200)
        accounts = res.json()
        self.assertGreater(len(accounts), 3)
        top = accounts[0]
        self.assertIn("RAPID_MONEY_MOVEMENT", top["detection_rules"])
        print(f"[TEST-PASS] Explainable suspicious engine verified. Top mule: {top['account_number_masked']} with score {top['risk_score']}")

    def test_07_linked_complaints_convergence(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        res = self.client.get("/api/linked-complaints", headers=headers)
        self.assertEqual(res.status_code, 200)
        links = res.json()
        self.assertGreater(len(links), 0)
        print(f"[TEST-PASS] Cross-complaint convergence verified ({len(links)} links found). Shared mule: {links[0]['shared_bank_name']} ({links[0]['shared_account_masked']})")

    def test_08_report_generation(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        res = self.client.post("/api/reports/generate", json={"complaint_id": 1}, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("REP-2026", data["report_number"])
        self.assertIn(".pdf", data["pdf_url"])
        print(f"[TEST-PASS] ReportLab PDF generation verified. Report ID: {data['report_number']}")

if __name__ == "__main__":
    unittest.main()

