import json
import networkx as nx
from typing import Dict, List, Any, Set
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.complaint import Complaint
from ..models.bank_account import BankAccount
from ..models.transaction import Transaction
from ..models.linked_complaint import LinkedComplaint
from .graph_engine import MoneyTrailGraphEngine

class LinkedComplaintDetector:
    def __init__(self, db: Session):
        self.db = db

    def detect_linked_complaints(self, max_hops: int = 4) -> List[Dict[str, Any]]:
        """
        Traverses downstream paths of all registered complaints using NetworkX.
        Identifies intersection points (shared mule or sink accounts) where money trails converge.
        Updates the linked_complaints table with explainable cross-complaint leads.
        """
        engine = MoneyTrailGraphEngine(self.db)
        G = engine.build_global_graph()

        complaints = self.db.query(Complaint).all()
        complaint_reach_maps: Dict[int, Dict[str, List[str]]] = {}

        # For each complaint, find downstream reachable accounts and shortest paths
        for comp in complaints:
            initial_txn = self.db.query(Transaction).filter(Transaction.utr_number == comp.utr_number).first()
            if not initial_txn:
                continue

            start_node = str(initial_txn.to_account_id) # The direct beneficiary mule
            if not G.has_node(start_node):
                continue

            reach_map = {start_node: [start_node]}
            # BFS up to max_hops
            queue = [(start_node, [start_node], 0)]
            while queue:
                curr, path, depth = queue.pop(0)
                if depth >= max_hops:
                    continue
                for succ in G.successors(curr):
                    if succ not in reach_map:
                        new_path = path + [succ]
                        reach_map[succ] = new_path
                        queue.append((succ, new_path, depth + 1))

            complaint_reach_maps[comp.id] = reach_map

        # Now check pairs of complaints for common reachable nodes
        detected_links = []
        comp_ids = list(complaint_reach_maps.keys())

        for i in range(len(comp_ids)):
            for j in range(i + 1, len(comp_ids)):
                id_a = comp_ids[i]
                id_b = comp_ids[j]

                map_a = complaint_reach_maps[id_a]
                map_b = complaint_reach_maps[id_b]

                common_nodes = set(map_a.keys()).intersection(set(map_b.keys()))
                if not common_nodes:
                    continue

                comp_a = self.db.query(Complaint).filter(Complaint.id == id_a).first()
                comp_b = self.db.query(Complaint).filter(Complaint.id == id_b).first()

                for shared_node_id in common_nodes:
                    shared_acc = self.db.query(BankAccount).filter(BankAccount.id == int(shared_node_id)).first()
                    if not shared_acc:
                        continue

                    path_a_str = " -> ".join([G.nodes[n].get("masked_account", n) for n in map_a[shared_node_id]])
                    path_b_str = " -> ".join([G.nodes[n].get("masked_account", n) for n in map_b[shared_node_id]])
                    
                    path_summary = f"Complaint {comp_a.complaint_number} path ({path_a_str}) intersects with {comp_b.complaint_number} path ({path_b_str}) at {shared_acc.bank_name} ({shared_acc.masked_account_number})."
                    total_amount = comp_a.amount + comp_b.amount

                    # Upsert into linked_complaints
                    existing = self.db.query(LinkedComplaint).filter(
                        ((LinkedComplaint.complaint_a_id == id_a) & (LinkedComplaint.complaint_b_id == id_b) & (LinkedComplaint.shared_account_id == shared_acc.id)) |
                        ((LinkedComplaint.complaint_a_id == id_b) & (LinkedComplaint.complaint_b_id == id_a) & (LinkedComplaint.shared_account_id == shared_acc.id))
                    ).first()

                    if not existing:
                        link = LinkedComplaint(
                            complaint_a_id=id_a,
                            complaint_b_id=id_b,
                            shared_account_id=shared_acc.id,
                            connection_type="Direct Mule Convergence",
                            path_summary=path_summary,
                            total_combined_amount=total_amount,
                            confidence_score=94.5,
                            created_at=datetime.utcnow()
                        )
                        self.db.add(link)
                    else:
                        existing.path_summary = path_summary
                        existing.total_combined_amount = total_amount

                    detected_links.append({
                        "complaint_a_id": id_a,
                        "complaint_a_number": comp_a.complaint_number,
                        "complaint_a_victim": comp_a.victim_name,
                        "complaint_b_id": id_b,
                        "complaint_b_number": comp_b.complaint_number,
                        "complaint_b_victim": comp_b.victim_name,
                        "shared_account_id": shared_acc.id,
                        "shared_account_masked": shared_acc.masked_account_number,
                        "shared_bank_name": shared_acc.bank_name,
                        "total_combined_amount": total_amount,
                        "path_summary": path_summary
                    })

        self.db.commit()
        return detected_links

