import networkx as nx
from typing import Dict, List, Any, Optional, Set
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.bank_account import BankAccount
from ..models.transaction import Transaction
from ..models.complaint import Complaint

class MoneyTrailGraphEngine:
    def __init__(self, db: Session):
        self.db = db

    def build_global_graph(self) -> nx.DiGraph:
        """
        Builds a full directed NetworkX transaction graph from the database.
        Nodes = Bank accounts with metadata.
        Edges = Transactions with amounts, timestamps, UTRs.
        """
        G = nx.DiGraph()

        # Load all accounts
        accounts = self.db.query(BankAccount).all()
        for acc in accounts:
            G.add_node(
                str(acc.id),
                account_id=acc.id,
                account_number=acc.account_number,
                masked_account=acc.masked_account_number,
                bank_name=acc.bank_name,
                holder_name=acc.account_holder_name,
                risk_score=acc.risk_score,
                risk_category=acc.risk_category,
                device_id=acc.device_id,
                ip_address=acc.ip_address,
                is_frozen=acc.is_frozen
            )

        # Load all completed transactions
        transactions = self.db.query(Transaction).order_by(Transaction.transaction_date.asc()).all()
        for txn in transactions:
            from_id = str(txn.from_account_id)
            to_id = str(txn.to_account_id)
            if not G.has_node(from_id) or not G.has_node(to_id):
                continue

            G.add_edge(
                from_id,
                to_id,
                transaction_id=txn.id,
                utr_number=txn.utr_number,
                amount=txn.amount,
                timestamp=txn.transaction_date.isoformat(),
                transaction_date=txn.transaction_date,
                transaction_type=txn.transaction_type,
                channel=txn.channel,
                remarks=txn.remarks
            )

        return G

    def trace_money_trail(
        self,
        complaint: Optional[Complaint] = None,
        utr_number: Optional[str] = None,
        account_id: Optional[int] = None,
        max_depth: int = 5
    ) -> Dict[str, Any]:
        """
        Traces the complete money trail downstream from an initial fraudulent transaction
        or starting account, identifying hops, rapid movement, and layering paths.
        """
        G = self.build_global_graph()
        
        start_node_id = None
        initial_txn = None

        if utr_number:
            initial_txn = self.db.query(Transaction).filter(Transaction.utr_number == utr_number).first()
            if initial_txn:
                start_node_id = str(initial_txn.from_account_id)
        elif complaint:
            initial_txn = self.db.query(Transaction).filter(Transaction.utr_number == complaint.utr_number).first()
            if initial_txn:
                start_node_id = str(initial_txn.from_account_id)
            elif complaint.suspected_account_number:
                acc = self.db.query(BankAccount).filter(BankAccount.account_number == complaint.suspected_account_number).first()
                if acc:
                    start_node_id = str(acc.id)
        elif account_id:
            start_node_id = str(account_id)

        if not start_node_id or not G.has_node(start_node_id):
            # Fallback to any active high risk account if none specified
            high_risk = self.db.query(BankAccount).filter(BankAccount.risk_score >= 60).first()
            if high_risk:
                start_node_id = str(high_risk.id)
            else:
                return {
                    "complaint_id": complaint.id if complaint else None,
                    "complaint_number": complaint.complaint_number if complaint else None,
                    "utr_number": utr_number,
                    "total_traced_amount": 0.0,
                    "nodes": [],
                    "edges": [],
                    "suspicious_patterns": [],
                    "max_depth": 0,
                    "hop_breakdown": {}
                }

        # Perform BFS downstream from start_node_id up to max_depth
        subgraph_nodes: Set[str] = {start_node_id}
        queue = [(start_node_id, 0)]
        visited_levels = {start_node_id: 0}

        while queue:
            curr_node, depth = queue.pop(0)
            if depth >= max_depth:
                continue

            for successor in G.successors(curr_node):
                if successor not in visited_levels:
                    visited_levels[successor] = depth + 1
                    subgraph_nodes.add(successor)
                    queue.append((successor, depth + 1))
                else:
                    subgraph_nodes.add(successor)

        # Include predecessors of start_node_id if starting from intermediate mule account
        if account_id and not complaint:
            for pred in G.predecessors(start_node_id):
                subgraph_nodes.add(pred)
                visited_levels[pred] = -1

        subgraph = G.subgraph(subgraph_nodes)

        # Build Cytoscape-compatible response
        nodes_out = []
        edges_out = []
        total_amount = 0.0
        hop_breakdown: Dict[str, int] = {}
        patterns_detected = []

        for node_id in subgraph.nodes():
            data = subgraph.nodes[node_id]
            level = visited_levels.get(node_id, 0)
            
            # Determine node visualization role
            if level == 0 and initial_txn and node_id == str(initial_txn.from_account_id):
                node_type = "victim"
            elif level == 1:
                node_type = "mule_tier_1"
            elif level == 2:
                node_type = "mule_tier_2"
            elif level >= 3 and subgraph.out_degree(node_id) == 0:
                node_type = "cashout"
            elif level >= 3:
                node_type = "mule_tier_3"
            else:
                node_type = "normal" if data.get("risk_score", 0) < 30 else "mule_tier_1"

            hop_key = f"Hop {level}" if level >= 0 else "Source"
            hop_breakdown[hop_key] = hop_breakdown.get(hop_key, 0) + 1

            nodes_out.append({
                "id": str(node_id),
                "label": f"{data.get('bank_name')} ({data.get('masked_account')})",
                "masked_account": data.get("masked_account", ""),
                "bank_name": data.get("bank_name", ""),
                "holder_name": data.get("holder_name", ""),
                "risk_score": float(data.get("risk_score", 0.0)),
                "risk_category": data.get("risk_category", "Low"),
                "node_type": node_type,
                "device_id": data.get("device_id"),
                "is_frozen": data.get("is_frozen", False)
            })

        # Process edges and analyze rapid movement
        for u, v, edge_data in subgraph.edges(data=True):
            amt = float(edge_data.get("amount", 0.0))
            total_amount += amt
            edge_id = f"e_{u}_{v}_{edge_data.get('transaction_id')}"
            
            # Detect rapid movement (within 30 mins from previous incoming)
            speed_flag = None
            is_suspicious_flow = False
            
            in_edges = list(subgraph.in_edges(u, data=True))
            if in_edges:
                curr_date = edge_data.get("transaction_date")
                for _, _, in_data in in_edges:
                    in_date = in_data.get("transaction_date")
                    if in_date and curr_date and curr_date >= in_date:
                        diff_minutes = (curr_date - in_date).total_seconds() / 60.0
                        if diff_minutes <= 45:
                            speed_flag = f"Rapid pass-through in {int(diff_minutes)} mins"
                            is_suspicious_flow = True
                            patterns_detected.append({
                                "pattern": "RAPID_MONEY_MOVEMENT",
                                "from_account": subgraph.nodes[u].get("masked_account"),
                                "to_account": subgraph.nodes[v].get("masked_account"),
                                "amount": amt,
                                "duration_mins": int(diff_minutes)
                            })
                            break

            edges_out.append({
                "id": edge_id,
                "source": str(u),
                "target": str(v),
                "amount": amt,
                "formatted_amount": f"₹{amt:,.2f}",
                "utr_number": edge_data.get("utr_number", ""),
                "timestamp": edge_data.get("timestamp", ""),
                "transaction_type": edge_data.get("transaction_type", "IMPS"),
                "is_suspicious_flow": is_suspicious_flow,
                "speed_flag": speed_flag
            })

        return {
            "complaint_id": complaint.id if complaint else None,
            "complaint_number": complaint.complaint_number if complaint else None,
            "utr_number": utr_number or (initial_txn.utr_number if initial_txn else None),
            "total_traced_amount": total_amount,
            "nodes": nodes_out,
            "edges": edges_out,
            "suspicious_patterns": patterns_detected,
            "max_depth": max(visited_levels.values()) if visited_levels else 0,
            "hop_breakdown": hop_breakdown
        }
