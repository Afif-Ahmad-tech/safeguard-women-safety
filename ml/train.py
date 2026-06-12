import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, roc_auc_score
from xgboost import XGBClassifier
import pickle
import os

df = pd.read_csv("data/incidents_sample.csv")
df["is_night"] = ((df["hour"] >= 20) | (df["hour"] <= 6)).astype(int)
df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
le = LabelEncoder()
df["incident_type_enc"] = le.fit_transform(df["incident_type"])
features = ["latitude", "longitude", "hour_sin", "hour_cos", "is_night", "severity", "incident_type_enc"]
X = df[features]
y = df["risk_label"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
model = XGBClassifier(n_estimators=200, max_depth=5, learning_rate=0.1, subsample=0.8, colsample_bytree=0.8, eval_metric="logloss", random_state=42)
model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]
print("\n=== Model Evaluation ===")
print(classification_report(y_test, y_pred))
print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")
os.makedirs("../backend/app/ml", exist_ok=True)
with open("../backend/app/ml/risk_model.pkl", "wb") as f:
    pickle.dump({"model": model, "label_encoder": le, "features": features}, f)
print("\nModel saved to backend/app/ml/risk_model.pkl")
