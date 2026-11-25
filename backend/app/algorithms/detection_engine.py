import json
import networkx as nx
from typing import Dict, List, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.bank_account import BankAccount
from ..models.transaction import Transaction
from ..models.suspicious_account import SuspiciousAccount

class SuspiciousDetectionEngine:
    def __init__(self, db: Session):
        self.db = db
        # Configurable detection thresholds
        self.config = {
            "rapid_movement_window_minutes": 60,
            "rapid_movement_passthrough_ratio": 0.70,
            "fan_out_recipient_threshold": 3,
            "fan_in_sender_threshold": 3,
            "unusual_volume_threshold": 100000.0, # ₹1,00,000 sudden burst
            "rapid_movement_weight": 30.0,
            "fan_out_weight": 25.0,
            "fan_in_weight": 20.0,
            "circular_weight": 35.0,
            "unusual_volume_weight": 20.0,
            "shared_identifier_weight": 30.0
        }

    def analyze_account(self, account: BankAccount, G: nx.DiGraph = None) -> Tuple[float, str, List[str], List[Dict[str, Any]]]:
        """
        Analyzes a single bank account across all 6 fraud detection patterns.
        Returns: (risk_score, risk_category, triggered_rule_codes, detailed_reasons)
        """
        score = 0.0
        triggered_rules = []
        reasons = []

        acc_id = account.id
        incoming_txns = self.db.query(Transaction).filter(Transaction.to_account_id == acc_id).all()
        outgoing_txns = self.db.query(Transaction).filter(Transaction.from_account_id == acc_id).all()

        total_in = sum(t.amount for t in incoming_txns)
        total_out = sum(t.amount for t in outgoing_txns)

        # ----------------------------------------------------
        # Rule 1: RAPID MONEY MOVEMENT
        # ----------------------------------------------------
        rapid_moves = []
        for inc in incoming_txns:
            inc_time = inc.transaction_date
            matching_out = [
                out for out in outgoing_txns
                if out.transaction_date >= inc_time
                and (out.transaction_date - inc_time).total_seconds() <= self.config["rapid_movement_window_minutes"] * 60
            ]
            out_sum = sum(o.amount for o in matching_out)
            if inc.amount > 0 and (out_sum / inc.amount) >= self.config["rapid_movement_passthrough_ratio"]:
                rapid_moves.append({
                    "incoming_utr": inc.utr_number,
                    "incoming_amount": inc.amount,
                    "outgoing_utrs": [o.utr_number for o in matching_out],
                    "outgoing_amount": out_sum,
                    "passthrough_ratio": round((out_sum / inc.amount) * 100, 1),
                    "window_mins": round((matching_out[0].transaction_date - inc_time).total_seconds() / 60, 1)
                })

        if rapid_moves:
            w = self.config["rapid_movement_weight"]
            score += w
            triggered_rules.append("RAPID_MONEY_MOVEMENT")
            reasons.append({
                "rule": "RAPID_MONEY_MOVEMENT",
                "title": "Rapid Money Movement (Pass-Through Mule)",
                "description": f"Transferred {rapid_moves[0]['passthrough_ratio']}% of incoming funds within {rapid_moves[0]['window_mins']} minutes. Minimal fund retention indicates transit mule behavior.",
                "weight": w,
                "evidence": rapid_moves
            })

        # ----------------------------------------------------
        # Rule 2: FAN-OUT PATTERN (Layering / Smurfing)
        # ----------------------------------------------------
        recipient_accounts = set(t.to_account_id for t in outgoing_txns)
        if len(recipient_accounts) >= self.config["fan_out_recipient_threshold"]:
            w = self.config["fan_out_weight"]
            score += w
            triggered_rules.append("FAN_OUT")
            reasons.append({
                "rule": "FAN_OUT",
                "title": "Fan-Out Layering Dispersion",
                "description": f"Funds dispersed outward to {len(recipient_accounts)} distinct beneficiary accounts. Consistent with structured layering or smurfing.",
                "weight": w,
                "evidence": {"distinct_recipients": len(recipient_accounts), "total_disbursed": total_out}
            })

        # ----------------------------------------------------
        # Rule 3: FAN-IN PATTERN (Consolidation)
        # ----------------------------------------------------
        sender_accounts = set(t.from_account_id for t in incoming_txns)
        if len(sender_accounts) >= self.config["fan_in_sender_threshold"]:
            w = self.config["fan_in_weight"]
            score += w
            triggered_rules.append("FAN_IN")
            reasons.append({
                "rule": "FAN_IN",
                "title": "Fan-In Fund Consolidation",
                "description": f"Aggregated deposits received from {len(sender_accounts)} separate remitter accounts. Acts as a collection sink.",
                "weight": w,
                "evidence": {"distinct_senders": len(sender_accounts), "total_collected": total_in}
            })

        # ----------------------------------------------------
        # Rule 4: CIRCULAR TRANSACTIONS (Cycle Detection)
        # ----------------------------------------------------
        if G is not None and str(acc_id) in G:
            try:
                # Find simple cycles involving this node
                cycles = nx.simple_cycles(G)
                account_str = str(acc_id)
                for cycle in cycles:
                    if account_str in cycle and len(cycle) >= 3:
                        w = self.config["circular_weight"]
                        score += w
                        triggered_rules.append("CIRCULAR_TRANSACTIONS")
                        reasons.append({
                            "rule": "CIRCULAR_TRANSACTIONS",
                            "title": "Circular Transaction Ring Detected",
                            "description": f"Account participates in a closed circular loop ({' -> '.join(cycle)} -> {cycle[0]}), masking origin of funds.",
                            "weight": w,
                            "evidence": {"cycle_path": cycle}
                        })
                        break
            except Exception:
                pass

        # ----------------------------------------------------
        # Rule 5: UNUSUAL TRANSACTION VOLUME
        # ----------------------------------------------------
        if total_in >= self.config["unusual_volume_threshold"] or total_out >= self.config["unusual_volume_threshold"]:
            w = self.config["unusual_volume_weight"]
            score += w
            triggered_rules.append("UNUSUAL_VOLUME")
            reasons.append({
                "rule": "UNUSUAL_VOLUME",
                "title": "High Velocity Transaction Inflow/Outflow",
                "description": f"Cumulative processed volume (In: ₹{total_in:,.2f}, Out: ₹{total_out:,.2f}) deviates significantly from standard retail account limits.",
                "weight": w,
                "evidence": {"total_incoming": total_in, "total_outgoing": total_out}
            })

        # ----------------------------------------------------
        # Rule 6: SHARED IDENTIFIERS (Device ID / IP reuse)
        # ----------------------------------------------------
        if account.device_id:
            shared_device_accounts = self.db.query(BankAccount).filter(
                BankAccount.device_id == account.device_id,
                BankAccount.id != account.id
            ).all()
            if shared_device_accounts:
                w = self.config["shared_identifier_weight"]
                score += w
                triggered_rules.append("SHARED_IDENTIFIERS")
                reasons.append({
                    "rule": "SHARED_IDENTIFIERS",
                    "title": "Synthetic Device Fingerprint Sharing",
                    "description": f"Device identifier '{account.device_id}' is shared across {len(shared_device_accounts) + 1} distinct bank accounts in different banks.",
                    "weight": w,
                    "evidence": {
                        "shared_device_id": account.device_id,
                        "linked_accounts": [a.masked_account_number for a in shared_device_accounts]
                    }
                })

        # Clamp score between 0 and 100
        final_score = min(max(score, 0.0), 100.0)

        # Categorize
        if final_score <= 30.0:
            category = "Low"
        elif final_score <= 60.0:
            category = "Medium"
        elif final_score <= 80.0:
            category = "High"
        else:
            category = "Critical"

        return final_score, category, triggered_rules, reasons

    def run_full_scan(self):
        """
        Runs the explainable detection engine across all bank accounts in the database
        and stores the results in suspicious_accounts table.
        """
        from .graph_engine import MoneyTrailGraphEngine
        graph_engine = MoneyTrailGraphEngine(self.db)
        G = graph_engine.build_global_graph()

        accounts = self.db.query(BankAccount).all()
        for acc in accounts:
            score, category, rules, reasons = self.analyze_account(acc, G)
            acc.risk_score = score
            acc.risk_category = category

            # Check if record exists in suspicious_accounts
            susp = self.db.query(SuspiciousAccount).filter(SuspiciousAccount.account_id == acc.id).first()
            if score >= 35.0: # Track Medium, High, Critical
                if not susp:
                    susp = SuspiciousAccount(
                        account_id=acc.id,
                        risk_score=score,
                        risk_category=category,
                        detection_rules=json.dumps(rules),
                        reasons=json.dumps(reasons),
                        detected_at=datetime.utcnow()
                    )
                    self.db.add(susp)
                else:
                    susp.risk_score = score
                    susp.risk_category = category
                    susp.detection_rules = json.dumps(rules)
                    susp.reasons = json.dumps(reasons)
            else:
                if susp:
                    self.db.delete(susp)

        self.db.commit()

