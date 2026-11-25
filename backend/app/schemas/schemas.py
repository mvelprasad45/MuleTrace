from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    badge_number: Optional[str] = None
    role: Optional[str] = "Investigation Officer"
    department: Optional[str] = "Cyber Crime Unit"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    badge_number: Optional[str]
    role: str
    department: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Bank Account Schemas ---
class BankAccountBase(BaseModel):
    account_number: str
    masked_account_number: str
    bank_name: str
    ifsc_code: str
    account_holder_name: str
    account_type: str = "Savings"
    upi_id: Optional[str] = None
    device_id: Optional[str] = None
    ip_address: Optional[str] = None
    branch_city: Optional[str] = "Mumbai"
    risk_score: float = 0.0
    risk_category: str = "Low"
    is_frozen: bool = False

class BankAccountResponse(BankAccountBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    utr_number: str
    from_account_id: int
    to_account_id: int
    amount: float
    transaction_date: datetime
    transaction_type: str = "IMPS"
    status: str = "Completed"
    channel: str = "Mobile Banking"
    remarks: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    from_account_masked: Optional[str] = None
    from_bank_name: Optional[str] = None
    to_account_masked: Optional[str] = None
    to_bank_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Complaint Schemas ---
class ComplaintCreate(BaseModel):
    victim_name: str
    victim_mobile: str
    bank_name: str
    masked_account_number: str
    utr_number: str
    amount: float
    transaction_date: str
    transaction_time: str
    suspected_upi_id: Optional[str] = None
    suspected_account_number: Optional[str] = None
    fraud_description: str
    priority: Optional[str] = "High"

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_investigator_id: Optional[int] = None
    fraud_description: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: int
    complaint_number: str
    victim_name: str
    victim_mobile: str
    bank_name: str
    masked_account_number: str
    utr_number: str
    amount: float
    transaction_date: str
    transaction_time: str
    suspected_upi_id: Optional[str]
    suspected_account_number: Optional[str]
    fraud_description: str
    status: str
    priority: str
    assigned_investigator_id: Optional[int]
    assigned_investigator_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Suspicious Account Schemas ---
class SuspiciousAccountResponse(BaseModel):
    id: int
    account_id: int
    account_number_masked: str
    account_holder_name: str
    bank_name: str
    risk_score: float
    risk_category: str
    detection_rules: List[str]
    reasons: List[Dict[str, Any]]
    device_id: Optional[str]
    ip_address: Optional[str]
    is_frozen: bool
    detected_at: datetime

# --- Linked Complaint Schemas ---
class LinkedComplaintResponse(BaseModel):
    id: int
    complaint_a_id: int
    complaint_a_number: str
    complaint_a_victim: str
    complaint_b_id: int
    complaint_b_number: str
    complaint_b_victim: str
    shared_account_id: int
    shared_account_masked: str
    shared_bank_name: str
    connection_type: str
    path_summary: str
    total_combined_amount: float
    confidence_score: float
    created_at: datetime

# --- Evidence Schemas ---
class EvidenceResponse(BaseModel):
    id: int
    complaint_id: int
    file_name: str
    file_path: str
    file_size: int
    file_type: str
    category: str
    sha256_hash: str
    notes: Optional[str]
    uploaded_at: datetime
    uploader_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Investigation Note Schemas ---
class NoteCreate(BaseModel):
    note_text: str
    is_lead: bool = True

class NoteResponse(BaseModel):
    id: int
    complaint_id: int
    note_text: str
    is_lead: bool
    author_name: str
    created_at: datetime

# --- Graph / Money Trail Schemas ---
class GraphNode(BaseModel):
    id: str
    label: str
    masked_account: str
    bank_name: str
    holder_name: str
    risk_score: float
    risk_category: str
    node_type: str # 'victim', 'mule_tier_1', 'mule_tier_2', 'mule_tier_3', 'cashout', 'normal'
    device_id: Optional[str] = None
    is_frozen: bool = False

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    amount: float
    formatted_amount: str
    utr_number: str
    timestamp: str
    transaction_type: str
    is_suspicious_flow: bool = False
    speed_flag: Optional[str] = None # e.g. "Transferred within 4 mins"

class MoneyTrailResponse(BaseModel):
    complaint_id: Optional[int] = None
    complaint_number: Optional[str] = None
    utr_number: Optional[str] = None
    total_traced_amount: float
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    suspicious_patterns: List[Dict[str, Any]]
    max_depth: int
    hop_breakdown: Dict[str, Any]

# --- Dashboard Stats Schema ---
class DashboardStatsResponse(BaseModel):
    total_complaints: int
    transactions_analysed: int
    suspicious_accounts: int
    active_investigations: int
    high_risk_networks: int
    total_defrauded_amount: float
    total_frozen_amount: float
    network_distribution: Dict[str, int]
    daily_volume: List[Dict[str, Any]]
    fraud_pattern_breakdown: List[Dict[str, Any]]
