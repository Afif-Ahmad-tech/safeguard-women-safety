from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, sos, incidents, heatmap, contacts
from app.database import engine, Base

app = FastAPI(
    title="SafeGuard API",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://safeguard-women-safety-qydm-4hkk5lxb5.vercel.app",
        "https://safeguard-women-safety-qydm.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# API Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(sos.router, prefix="/api/sos", tags=["SOS"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(heatmap.router, prefix="/api/heatmap", tags=["Heatmap"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["Contacts"])

# Health Check Endpoint
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "SafeGuard"
    }