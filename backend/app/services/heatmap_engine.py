import numpy as np
from typing import List

def compute_heatmap_grid(incidents) -> List[dict]:
    if not incidents:
        return []
    points = []
    for inc in incidents:
        weight = inc.severity * 1.0
        points.append({"lat": inc.latitude, "lng": inc.longitude, "intensity": min(weight / 3.0, 1.0), "type": inc.incident_type, "severity": inc.severity})
    return points

def compute_area_risk_score(lat: float, lng: float, incidents, hour: int = 20) -> float:
    if not incidents:
        return 5.0
    total_weight = 0.0
    for inc in incidents:
        dist = np.sqrt((inc.latitude - lat)**2 + (inc.longitude - lng)**2) * 111
        if dist < 0.5:
            time_factor = 1.5 if (hour >= 20 or hour <= 6) else 1.0
            total_weight += (inc.severity * time_factor) / max(dist, 0.01)
    return min(total_weight * 10, 100.0)
