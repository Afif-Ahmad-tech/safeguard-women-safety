# 🛡️ SafeGuard — Women Safety Heatmap & SOS Network

Built for **UN SDG #3 — Good Health & Well-Being**
at a 6-hour Hackathon.

## 🚨 What is SafeGuard?

SafeGuard is a community-powered women safety web application that:
- 🗺️ Shows **live AI safety heatmap** of dangerous zones
- 🚨 One-tap **SOS button** sends live GPS to trusted contacts
- 🤖 **ML risk scoring** (XGBoost, ROC-AUC: 0.9999)
- 📍 **Click any location** to see community reports + AI verdict
- ✅ **"I'm Safe"** notification resolves alerts

## 📸 Screenshots

| Safety Map | SOS Alert | Email Alert |
|---|---|---|
| Live heatmap with red zones | One-tap emergency SOS | Instant email with GPS |

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python, PostgreSQL |
| Frontend | React PWA, Leaflet Maps |
| ML Model | XGBoost, scikit-learn |
| Auth | JWT, bcrypt |
| Notifications | Gmail SMTP, Twilio (SMS/WhatsApp) |
| Realtime | WebSocket |

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node 20+
- PostgreSQL

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your credentials in .env
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### ML Model Training
```bash
cd ml
python3 generate_synthetic_data.py
python3 train.py
```

## 🌍 SDG Impact

**UN SDG #3 — Good Health & Well-Being**
Target 3.d: Strengthen capacity for early warning and risk reduction

- 146 million female migrants globally need safety infrastructure
- 40 lakh migrant women in Bengaluru alone
- Community-powered → gets smarter with every user

## 📊 ML Model Performance

- Training records: 5,900+
- Algorithm: XGBoost
- ROC-AUC Score: 0.9999
- Features: Location, time of day, severity, incident type

## 🔮 Future Roadmap

- WhatsApp + Voice call alerts via Twilio
- Native mobile app (React Native)
- Police helpline API integration
- Safe route suggestion
- Multi-city expansion

## 📝 License

MIT License — Built with ❤️ for women's safety

---

*"Every report makes every woman safer."*
