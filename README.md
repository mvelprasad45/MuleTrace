# MULETRACE: AI-Powered Financial Fraud Network Investigation & Money Trail Tracking System

> **Financial Cybercrime Intelligence & Mule Network Forensic Command Centre**  
> *A prototype designed to complement national mule account detection systems such as RBI's MuleHunter.AI.*

---

## 🛡️ Executive Summary

**MULETRACE** is a specialized cybercrime investigation platform designed for law enforcement officers, financial intelligence units (FIUs), and banking fraud investigators. While traditional fraud prevention focuses on isolated bank accounts, MULETRACE provides **network-level multi-hop investigation**, **cross-account transaction tracing**, **automated cross-complaint convergence**, and **explainable risk leads**.

> [!IMPORTANT]
> **DEMONSTRATION PROTOTYPE NOTICE:**  
> This application is built as a hackathon prototype using **100% realistic synthetic demonstration data**. It does not interface with production core-banking systems (CBS) or store real individuals' banking data. In accordance with legal principles, statistical detection rules represent investigative leads and do not constitute proof of criminal guilt.

---

## 🚀 Key Features

| Module | Core Capability |
| :--- | :--- |
| **Money Trail Tracing** | NetworkX directed graph analysis tracing fund dispersion, hop-by-hop layering depth, and pass-through velocity. Rendered interactively via **Cytoscape.js**. |
| **Explainable Fraud Detection** | Rule-based engine with configurable weights covering: Rapid Fund Movement, Fan-Out Smurfing, Fan-In Consolidation, Circular Transaction Loops, Unusual Velocity, and Shared Digital Fingerprints. |
| **Linked Complaint Detection** | Traverses independent victim complaints and identifies common destination accounts (convergence points), proving cross-case syndicate links. |
| **Digital Evidence Vault** | Secure repository for bank statements, SMS fraud screenshots, and WhatsApp chats with **live SHA-256 cryptographic integrity verification** (Section 65B compliance). |
| **Automated Forensic Dossiers** | One-click downloadable multi-page PDF investigation reports generated using **ReportLab** with DEMO DATA watermark, tables, and Section 91 CrPC notice blocks. |
| **Cyber Command UI/UX** | Dark command-centre aesthetic (`#020909`, `#00F5D4` neon cyan, glassmorphism panels, cyber grid matrix, Inter typography). |

---

## 🧬 Featured Demonstration Scenarios

The system comes pre-seeded with a complete, multi-tiered cybercrime investigation scenario:

1. **Scenario 1: Victim A (₹50,000 Electricity Bill SMS Scam)**
   - Victim Aditya Roy transfers ₹50,000 to primary transit mule **Account A (Kotak - `918273XXXX04`)**.
   - Within **12 minutes**, Account A clears 98% of the funds via a **Fan-Out** pattern to:
     - Account B (Axis - `349182XXXX05`): ₹16,000
     - Account C (PNB - `817263XXXX06`): ₹18,000
     - Account D (Canara - `192837XXXX07`): ₹15,000
   - These accounts layer funds to Tier-3 mules and crypto on-ramp wallets (Account G).

2. **Scenario 2: Multi-Victim Cross-Complaint Convergence**
   - Independent victim Sunita Deshmukh files **Complaint #1002** regarding a ₹75,000 "Digital Arrest" extortion scam.
   - Her money routes to Transit Mule H (`748291XXXX11`) and then routes into **Account C (PNB - `817263XXXX06`)**!
   - MULETRACE automatically matches the trajectories and flags **Account C as the common convergence mule** serving both crime syndicates.

3. **Scenario 3: Circular Transaction Ring**
   - Accounts D (`192837XXXX07`), I (`839201XXXX12`), and J (`920194XXXX13`) perform a closed cyclical loop (D → I → J → D) to artificially inflate transaction velocity and obfuscate origins.

4. **Scenario 4: Shared Device Fingerprinting**
   - Accounts C, K, and L share the synthetic device identifier `DEV-MULE-SHA-984` across different banks, exposing an organized mule ring operating from a single hardware device.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide React, Cytoscape.js, Recharts.
- **Backend**: Python 3.14 / 3.11+, FastAPI, SQLAlchemy, NetworkX, Pandas, ReportLab, Pydantic.
- **Database**: PostgreSQL (with automated zero-config SQLite fallback).
- **Security & Integrity**: JWT Authentication (HS256), bcrypt password hashing, SHA-256 evidence hashing, Role-Based Access Control (Admin / Investigation Officer).

---

## 🔑 Demo Account Credentials

Use these credentials on the login screen, or click the **Fast-Login** buttons on the login card:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Investigation Officer** | `officer@muletrace.gov.in` | `Officer@MuleTrace2026` |
| **Administrator** | `admin@muletrace.gov.in` | `Admin@CyberTrace2026` |

---

## 💻 Quick Start & Installation

### 1. Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed

### 2. Backend Setup
```bash
# 1. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 2. Seed database with synthetic bank accounts, transactions, and complaints
python backend/scripts/seed_data.py

# 3. Start FastAPI server
python -m uvicorn app.main:app --app-dir backend --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
# In a new terminal:
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/auth/login` | `POST` | Authenticate officer and issue JWT bearer token |
| `/api/dashboard/stats` | `GET` | Aggregated metrics, transaction volumes, risk distributions |
| `/api/complaints` | `GET` / `POST` | Filter, list, and register cyber fraud complaints |
| `/api/trace/{complaint_id}` | `GET` | NetworkX directed money trail graph for a complaint |
| `/api/trace/transaction/{utr}` | `GET` | Trace trail from a specific transaction UTR |
| `/api/accounts/suspicious` | `GET` | List flagged mule accounts with explainable rule tags |
| `/api/accounts/{id}/toggle-freeze` | `POST` | Apply or lift Section 91 debit lien freeze |
| `/api/linked-complaints` | `GET` | List cross-complaint convergence points |
| `/api/evidence/upload` | `POST` | Ingest evidence with automated SHA-256 calculation |
| `/api/evidence/verify/{id}` | `GET` | Realtime on-disk cryptographic integrity check |
| `/api/reports/generate` | `POST` | Compile official multi-page PDF dossier with ReportLab |
| `/api/reports/download/{id}` | `GET` | Download generated PDF report |

---

## 🏛️ Architecture & Project Structure

```
MuleTrace/
├── backend/
│   ├── app/
│   │   ├── algorithms/       # NetworkX money trail & suspicious rule engine
│   │   ├── api/routers/      # Modular REST endpoints (auth, trace, reports, etc.)
│   │   ├── database/         # SQLAlchemy engine with dual Postgres/SQLite support
│   │   ├── models/           # ORM models (accounts, txns, complaints, evidence)
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # ReportLab PDF generator & SHA-256 evidence vault
│   │   └── utils/            # JWT auth & bcrypt password security
│   ├── scripts/
│   │   ├── seed_data.py      # Realistic synthetic scenario seeder
│   │   └── direct_verify.py  # Automated 9-engine test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # CytoscapeGraph, Navbar, Sidebar, Layout
│   │   ├── context/          # JWT AuthContext
│   │   ├── pages/            # Dashboard, MoneyTrail, Complaints, Reports, etc.
│   │   ├── services/         # Axios API client with interceptors
│   │   └── types/            # TypeScript interfaces
│   └── package.json
├── .env.example
├── README.md
```

---

## ⚖️ Legal & Ethical Compliance
- Developed strictly for educational and hackathon evaluation purposes.
- Uses synthetic account numbers and simulated transaction volumes.
- Employs explainable AI metrics: all risk scores show the exact mathematical rules that contributed to them.

