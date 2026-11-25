import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.session import Base, get_engine, SessionLocal
from .models.user import User, UserRole
from .models.complaint import Complaint
from .utils.security import get_password_hash
from .api.routers import auth, dashboard, complaints, trace, network, accounts, linked, evidence, reports

# Ensure database tables exist
engine = get_engine()
Base.metadata.create_all(bind=engine)

def ensure_demo_users_and_data():
    db = SessionLocal()
    try:
        # 1. Ensure Administrator exists
        admin = db.query(User).filter(User.email == "admin@muletrace.gov.in").first()
        if not admin:
            admin = User(
                email="admin@muletrace.gov.in",
                hashed_password=get_password_hash("Admin@CyberTrace2026"),
                full_name="Rajesh Kumar Verma",
                badge_number="CCU-DIR-001",
                role=UserRole.ADMIN.value,
                department="Central Financial Intelligence & Cyber Division"
            )
            db.add(admin)
            print("[MULETRACE-STARTUP] Seeded Administrator: admin@muletrace.gov.in")

        # 2. Ensure Investigation Officer exists
        officer = db.query(User).filter(User.email == "officer@muletrace.gov.in").first()
        if not officer:
            officer = User(
                email="officer@muletrace.gov.in",
                hashed_password=get_password_hash("Officer@MuleTrace2026"),
                full_name="Pooja Sharma",
                badge_number="CCU-INV-442",
                role=UserRole.INVESTIGATOR.value,
                department="Mule Network Rapid Action Wing"
            )
            db.add(officer)
            print("[MULETRACE-STARTUP] Seeded Investigation Officer: officer@muletrace.gov.in")

        db.commit()

        # 3. Check if complaints are present
        complaints_count = db.query(Complaint).count()
        print(f"[MULETRACE-STARTUP] Database ready with {complaints_count} complaints.")
    except Exception as e:
        print(f"[MULETRACE-STARTUP-ERROR] {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_demo_users_and_data()
    yield

app = FastAPI(
    title="MULETRACE - Financial Cybercrime Investigation API",
    description="AI-Powered Financial Fraud Network Investigation & Money Trail Tracking Platform",
    version="2.0.0",
    lifespan=lifespan
)

# Fully permissive CORS for all localhost/127.0.0.1 ports and remote clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")
app.include_router(trace.router, prefix="/api")
app.include_router(network.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(linked.router, prefix="/api")
app.include_router(evidence.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.get("/")
def root():
    return {
        "system": "MULETRACE Cyber Intelligence Engine",
        "status": "OPERATIONAL",
        "version": "2.0.0",
        "environment": "DEMO_MODE",
        "compliance": "Synthetic Demonstration Data"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "MuleTrace Backend", "timestamp": "2026-11-24T22:35:00Z"}
