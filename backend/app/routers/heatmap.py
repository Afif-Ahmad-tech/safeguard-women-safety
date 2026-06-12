from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.incident import Incident
from app.services.heatmap_engine import compute_heatmap_grid
from app.ml.predict import predict_risk

router = APIRouter()

@router.get("/grid")
async def get_heatmap(lat: float, lng: float, radius_km: float = 5.0, db: AsyncSession = Depends(get_db)):
    delta = radius_km / 111.0
    result = await db.execute(
        select(Incident).where(
            Incident.latitude.between(lat - delta, lat + delta),
            Incident.longitude.between(lng - delta, lng + delta)
        )
    )
    incidents = result.scalars().all()
    heatmap_data = compute_heatmap_grid(incidents)
    return {"heatmap": heatmap_data, "total_incidents": len(incidents)}

@router.get("/risk-score")
async def get_risk_score(lat: float, lng: float, hour: int = None, db: AsyncSession = Depends(get_db)):
    import datetime
    if hour is None:
        hour = datetime.datetime.now().hour
    delta = 0.5 / 111.0
    result = await db.execute(
        select(Incident).where(
            Incident.latitude.between(lat - delta, lat + delta),
            Incident.longitude.between(lng - delta, lng + delta)
        )
    )
    incidents = result.scalars().all()
    if incidents:
        dominant_type = max(
            ["harassment","stalking","assault","unsafe_area","poor_lighting"],
            key=lambda t: sum(1 for i in incidents if i.incident_type == t)
        )
        avg_severity = sum(i.severity for i in incidents) / len(incidents)
    else:
        dominant_type = "unsafe_area"
        avg_severity = 1
    ml_score = predict_risk(lat, lng, hour, int(avg_severity), dominant_type)
    report_count = len(incidents)
    if report_count >= 5 or ml_score > 0.7:
        risk_level = "high"
    elif report_count >= 3 or ml_score > 0.4:
        risk_level = "medium"
    elif report_count >= 1 or ml_score > 0.2:
        risk_level = "low"
    else:
        risk_level = "safe"
    return {
        "ml_score": round(ml_score * 100, 1),
        "risk_level": risk_level,
        "report_count": report_count,
        "hour": hour,
        "dominant_type": dominant_type
    }
