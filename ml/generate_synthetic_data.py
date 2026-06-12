import pandas as pd
import numpy as np
import os

np.random.seed(42)
LAT_MIN, LAT_MAX = 18.87, 19.27
LNG_MIN, LNG_MAX = 72.77, 73.00
n_samples = 5000
incident_types = ["harassment", "stalking", "assault", "unsafe_area", "poor_lighting"]
hours = np.random.randint(0, 24, n_samples)
lats = np.random.uniform(LAT_MIN, LAT_MAX, n_samples)
lngs = np.random.uniform(LNG_MIN, LNG_MAX, n_samples)
hotspot_centers = [(19.05, 72.83), (18.96, 72.82), (19.18, 72.97)]
for center in hotspot_centers:
    n_extra = 300
    lats = np.append(lats, np.random.normal(center[0], 0.01, n_extra))
    lngs = np.append(lngs, np.random.normal(center[1], 0.01, n_extra))
    hours = np.append(hours, np.random.choice([21, 22, 23, 0, 1, 2], n_extra))
n_total = len(lats)
severities = np.random.choice([1, 2, 3], n_total, p=[0.5, 0.35, 0.15])
types = np.random.choice(incident_types, n_total)

def is_high_risk(lat, lng, hour, severity):
    night = hour >= 20 or hour <= 6
    for hc in hotspot_centers:
        dist = np.sqrt((lat - hc[0])**2 + (lng - hc[1])**2)
        if dist < 0.02 and night and severity >= 2:
            return 1
    if night and severity == 3:
        return 1
    return 0

risk_labels = [is_high_risk(lats[i], lngs[i], hours[i], severities[i]) for i in range(n_total)]
df = pd.DataFrame({"latitude": lats, "longitude": lngs, "hour": hours, "severity": severities, "incident_type": types, "risk_label": risk_labels})
os.makedirs("data", exist_ok=True)
df.to_csv("data/incidents_sample.csv", index=False)
print(f"Generated {len(df)} records. High-risk ratio: {df['risk_label'].mean():.2%}")
