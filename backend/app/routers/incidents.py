from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.incident import Incident

router = APIRouter()

class IncidentCreate(BaseModel):
    reporter_id: Optional[int] = None
    latitude: float
    longitude: float
    incident_type: str
    severity: int = 1
    description: Optional[str] = None
    area_name: Optional[str] = None
    time_of_day: Optional[int] = None

@router.post("/report")
async def report_incident(req: IncidentCreate, db: AsyncSession = Depends(get_db)):
    incident = Incident(**req.dict())
    db.add(incident)
    await db.commit()
    await db.refresh(incident)
    return {"id": incident.id, "status": "reported", "message": "Thank you for keeping the community safe."}

@router.get("/nearby")
async def get_nearby_incidents(lat: float, lng: float, radius_km: float = 2.0, db: AsyncSession = Depends(get_db)):
    delta = radius_km / 111.0
    result = await db.execute(
        select(Incident).where(
            Incident.latitude.between(lat - delta, lat + delta),
            Incident.longitude.between(lng - delta, lng + delta)
        ).order_by(Incident.reported_at.desc()).limit(100)
    )
    incidents = result.scalars().all()
    return [
        {"id": i.id, "latitude": i.latitude, "longitude": i.longitude,
         "type": i.incident_type, "severity": i.severity,
         "time_of_day": i.time_of_day, "reported_at": i.reported_at.isoformat()}
        for i in incidents
    ]

@router.get("/area-stats")
async def get_area_stats(area: str, db: AsyncSession = Depends(get_db)):
    area_lower = f"%{area.lower()}%"
    result = await db.execute(
        select(Incident).where(
            Incident.area_name.ilike(area_lower)
        ).order_by(Incident.reported_at.desc()).limit(50)
    )
    incidents = result.scalars().all()
    if not incidents:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No incidents found for this area")

    breakdown = {}
    for inc in incidents:
        breakdown[inc.incident_type] = breakdown.get(inc.incident_type, 0) + 1

    total_sev = sum(i.severity for i in incidents)
    risk_score = min((total_sev / max(len(incidents), 1)) * 33.3, 100)

    unique_reporters = len(set(i.reporter_id for i in incidents if i.reporter_id))

    recent = [
        {
            "incident_type": i.incident_type,
            "severity": i.severity,
            "description": i.description,
            "reported_at": i.reported_at.isoformat()
        }
        for i in incidents[:5]
    ]

    return {
        "area_name": area,
        "total_reports": len(incidents),
        "risk_score": risk_score,
        "unique_reporters": unique_reporters,
        "incident_breakdown": breakdown,
        "recent_reports": recent
    }


@router.get("/location-history")
async def get_location_history(lat: float, lng: float, radius_km: float = 1.5, db: AsyncSession = Depends(get_db)):
    """Get all incidents near a specific point with aggregated stats."""
    delta = radius_km / 111.0
    result = await db.execute(
        select(Incident).where(
            Incident.latitude.between(lat - delta, lat + delta),
            Incident.longitude.between(lng - delta, lng + delta)
        ).order_by(Incident.reported_at.desc())
    )
    incidents = result.scalars().all()

    if not incidents:
        return {"total": 0, "incidents": [], "risk_level": "safe", "dominant_type": None, "community_verdict": "No reports for this area"}

    type_counts = {}
    severity_sum = 0
    for inc in incidents:
        type_counts[inc.incident_type] = type_counts.get(inc.incident_type, 0) + 1
        severity_sum += inc.severity

    dominant = max(type_counts, key=type_counts.get)
    avg_severity = severity_sum / len(incidents)
    total = len(incidents)

    if total >= 5 or avg_severity >= 2.5:
        risk_level = "high"
    elif total >= 3 or avg_severity >= 1.8:
        risk_level = "medium"
    elif total >= 1:
        risk_level = "low"
    else:
        risk_level = "safe"

    verdicts = {
        "high": f"🔴 Danger zone — {total} reports. Avoid this area especially at night.",
        "medium": f"🟡 Use caution — {total} reports of {dominant.replace('_',' ')} in this area.",
        "low": f"🟢 Mostly safe — {total} report(s). Stay alert.",
        "safe": "✅ No reports for this area."
    }

    return {
        "total": total,
        "risk_level": risk_level,
        "dominant_type": dominant,
        "avg_severity": round(avg_severity, 1),
        "type_breakdown": type_counts,
        "community_verdict": verdicts[risk_level],
        "incidents": [
            {
                "id": i.id,
                "type": i.incident_type,
                "severity": i.severity,
                "description": i.description,
                "time_of_day": i.time_of_day,
                "reported_at": i.reported_at.isoformat()
            } for i in incidents[:10]
        ]
    }
