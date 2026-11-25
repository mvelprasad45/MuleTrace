export interface User {
  id: number;
  email: string;
  full_name: string;
  badge_number: string | null;
  role: 'Administrator' | 'Investigation Officer';
  department: string;
}

export interface Complaint {
  id: number;
  complaint_number: string;
  victim_name: string;
  victim_mobile: string;
  bank_name: string;
  masked_account_number: string;
  utr_number: string;
  amount: number;
  transaction_date: string;
  transaction_time: string;
  suspected_upi_id: string | null;
  suspected_account_number: string | null;
  fraud_description: string;
  status: 'New' | 'Under Investigation' | 'Evidence Required' | 'Escalated' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assigned_investigator_id: number | null;
  assigned_investigator_name: string;
  created_at: string;
}

export interface GraphNode {
  id: string;
  label: string;
  masked_account: string;
  bank_name: string;
  holder_name: string;
  risk_score: number;
  risk_category: 'Low' | 'Medium' | 'High' | 'Critical';
  node_type: 'victim' | 'mule_tier_1' | 'mule_tier_2' | 'mule_tier_3' | 'cashout' | 'normal';
  device_id: string | null;
  is_frozen: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  formatted_amount: string;
  utr_number: string;
  timestamp: string;
  transaction_type: string;
  is_suspicious_flow: boolean;
  speed_flag: string | null;
}

export interface MoneyTrail {
  complaint_id: number | null;
  complaint_number: string | null;
  utr_number: string | null;
  total_traced_amount: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  suspicious_patterns: Array<{
    pattern: string;
    from_account?: string;
    to_account?: string;
    amount?: number;
    duration_mins?: number;
  }>;
  max_depth: number;
  hop_breakdown: Record<string, number>;
}

export interface SuspiciousAccount {
  id: number;
  account_id: number;
  account_number_masked: string;
  account_holder_name: string;
  bank_name: string;
  risk_score: number;
  risk_category: 'Low' | 'Medium' | 'High' | 'Critical';
  detection_rules: string[];
  reasons: Array<{
    rule: string;
    title: string;
    description: string;
    weight: number;
    evidence: any;
  }>;
  device_id: string | null;
  ip_address: string | null;
  is_frozen: boolean;
  detected_at: string;
}

export interface LinkedComplaint {
  id: number;
  complaint_a_id: number;
  complaint_a_number: string;
  complaint_a_victim: string;
  complaint_b_id: number;
  complaint_b_number: string;
  complaint_b_victim: string;
  shared_account_id: number;
  shared_account_masked: string;
  shared_bank_name: string;
  connection_type: string;
  path_summary: string;
  total_combined_amount: number;
  confidence_score: number;
  created_at: string;
}

export interface EvidenceItem {
  id: number;
  complaint_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  sha256_hash: string;
  notes: string | null;
  uploaded_at: string;
  uploader_name: string;
}

export interface InvestigationReport {
  id: number;
  report_number: string;
  complaint_id: number;
  complaint_number: string;
  title: string;
  investigator_name: string;
  pdf_url: string;
  created_at: string;
}

export interface DashboardStats {
  total_complaints: number;
  transactions_analysed: number;
  suspicious_accounts: number;
  active_investigations: number;
  high_risk_networks: number;
  total_defrauded_amount: number;
  total_frozen_amount: number;
  network_distribution: Record<string, number>;
  daily_volume: Array<{ day: string; amount: number; txns: number }>;
  fraud_pattern_breakdown: Array<{ name: string; count: number; risk: string }>;
}

