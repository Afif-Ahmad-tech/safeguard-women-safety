from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, sos, incidents, heatmap, contacts
from app.database import engine, Base

app = FastAPI(title="SafeGuard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(sos.router, prefix="/api/sos", tags=["sos"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["incidents"])
app.include_router(heatmap.router, prefix="/api/heatmap", tags=["heatmap"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["contacts"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "SafeGuard"}