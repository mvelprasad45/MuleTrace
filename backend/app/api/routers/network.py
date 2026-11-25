from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...database.session import get_db
from ...schemas.schemas import MoneyTrailResponse
from ...algorithms.graph_engine import MoneyTrailGraphEngine
from ...models.complaint import Complaint
from ..deps import get_current_user

router = APIRouter(prefix="/network", tags=["Network Analysis"])

@router.get("/{complaint_id}", response_model=MoneyTrailResponse)
def get_complaint_network(complaint_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    engine = MoneyTrailGraphEngine(db)
    return engine.trace_money_trail(complaint=complaint, max_depth=6)

@router.get("/account/{account_id}", response_model=MoneyTrailResponse)
def get_account_network(account_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    engine = MoneyTrailGraphEngine(db)
    return engine.trace_money_trail(account_id=account_id, max_depth=4)

@router.get("/overview/global")
def get_global_network_overview(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    engine = MoneyTrailGraphEngine(db)
    G = engine.build_global_graph()
    
    nodes_summary = []
    for n in G.nodes():
        d = G.nodes[n]
        nodes_summary.append({
            "id": n,
            "label": d.get("masked_account"),
            "bank_name": d.get("bank_name"),
            "holder_name": d.get("holder_name"),
            "risk_score": d.get("risk_score", 0),
            "risk_category": d.get("risk_category", "Low"),
            "is_frozen": d.get("is_frozen", False),
            "in_degree": G.in_degree(n),
            "out_degree": G.out_degree(n)
        })

    edges_summary = []
    for u, v, d in G.edges(data=True):
        edges_summary.append({
            "source": u,
            "target": v,
            "amount": d.get("amount", 0),
            "utr_number": d.get("utr_number", ""),
            "timestamp": d.get("timestamp", "")
        })

    return {
        "total_nodes": G.number_of_nodes(),
        "total_edges": G.number_of_edges(),
        "nodes": nodes_summary,
        "edges": edges_summary
    }
