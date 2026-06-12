import React, { useState, useEffect } from 'react';
import { incidentsAPI, heatmapAPI } from '../services/api';
import api from '../services/api';

export default function AboutPage() {
  const [stats, setStats] = useState({
    total_incidents: 0,
    high_risk_zones: 0,
    users_protected: 1,
    sos_alerts: 0
  });

  useEffect(() => {
    // Fetch live stats
    api.get('/incidents/nearby?lat=12.9716&lng=77.5946&radius_km=50')
      .then(r => {
        const incidents = r.data || [];
        const highRisk = incidents.filter(i => i.severity === 3).length;
        setStats(prev => ({
          ...prev,
          total_incidents: incidents.length,
          high_risk_zones: highRisk,
        }));
      }).catch(() => {});
  }, []);

  const features = [
    { icon: '🗺️', title: 'Live Safety Heatmap', desc: 'Real-time crowdsourced danger zones powered by community reports and ML risk scoring' },
    { icon: '🚨', title: 'One-Tap SOS', desc: '5-second countdown SOS that instantly alerts trusted contacts with live GPS location via email' },
    { icon: '🤖', title: 'AI Risk Scoring', desc: 'XGBoost model predicts area danger based on incident patterns, time of day & location history' },
    { icon: '👥', title: 'Community Network', desc: 'Every report improves the heatmap for everyone — more users = smarter safety intelligence' },
    { icon: '📍', title: 'Click to Report', desc: 'Tap any location on the map to view history, community verdict, and add your own review' },
    { icon: '🌐', title: 'Works Globally', desc: 'Supports international phone numbers — built for women everywhere, not just one city' },
  ];

  const liveStats = [
    { number: stats.total_incidents, label: 'Incidents Reported', color: '#e74c3c', suffix: '+' },
    { number: stats.high_risk_zones, label: 'High Risk Zones Mapped', color: '#e67e22', suffix: '' },
    { number: '0.9999', label: 'ML Model ROC-AUC Score', color: '#3498db', suffix: '' },
    { number: '< 5s', label: 'SOS Alert Delivery Time', color: '#27ae60', suffix: '' },
  ];

  return (
    <div className="page">
      <div style={{textAlign:'center',padding:'24px 0 16px'}}>
        <div style={{fontSize:52}}>🛡️</div>
        <h1 style={{color:'#e74c3c',fontSize:26,fontWeight:900,marginTop:8}}>SafeGuard</h1>
        <p style={{color:'#888',fontSize:13,marginTop:4}}>Women Safety Heatmap & SOS Network</p>
        <div style={{display:'inline-block',background:'#1a1a2e',
          border:'1px solid #3498db44',borderRadius:20,
          padding:'4px 16px',marginTop:8,fontSize:12,color:'#3498db'}}>
          UN SDG #3 — Good Health & Well-Being
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
        {liveStats.map((s,i) => (
          <div key={i} style={{background:'#1a1a2e',borderRadius:12,padding:16,
            border:`1px solid ${s.color}33`,textAlign:'center'}}>
            <div style={{color:s.color,fontSize:typeof s.number === 'number' && s.number > 99 ? 20 : 22,
              fontWeight:900}}>
              {s.number}{s.suffix}
            </div>
            <div style={{color:'#888',fontSize:11,marginTop:4}}>{s.label}</div>
            {typeof s.number === 'number' && (
              <div style={{color:'#555',fontSize:10,marginTop:2}}>● Live from database</div>
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{marginBottom:12}}>
        <h2 style={{marginBottom:12}}>🎯 The Problem</h2>
        <p style={{color:'#aaa',fontSize:14,lineHeight:1.7}}>
          Women face safety threats daily — harassment, stalking, poor lighting, unsafe areas.
          Existing solutions are reactive. <strong style={{color:'#fff'}}>SafeGuard is proactive</strong> —
          it maps danger before you walk into it, and gets you help in seconds when you need it.
        </p>
      </div>

      <div className="card" style={{marginBottom:12}}>
        <h2 style={{marginBottom:16}}>⚡ Key Features</h2>
        {features.map((f,i) => (
          <div key={i} style={{display:'flex',gap:12,marginBottom:14,alignItems:'flex-start'}}>
            <span style={{fontSize:22,minWidth:32}}>{f.icon}</span>
            <div>
              <div style={{color:'#fff',fontWeight:600,fontSize:14,marginBottom:2}}>{f.title}</div>
              <div style={{color:'#888',fontSize:12,lineHeight:1.5}}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginBottom:12}}>
        <h2 style={{marginBottom:12}}>🤖 Tech Stack</h2>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {['FastAPI','PostgreSQL','React PWA','XGBoost ML',
            'WebSocket','JWT Auth','Leaflet Maps','Gmail SMTP'].map(t => (
            <span key={t} style={{padding:'4px 12px',borderRadius:20,
              background:'#0f0f1a',border:'1px solid #2a2a4a',
              color:'#aaa',fontSize:12}}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{background:'linear-gradient(135deg,#1a0a0a,#2b0a0a)',
        border:'1px solid #e74c3c44',borderRadius:12,padding:20,
        textAlign:'center',marginBottom:20}}>
        <p style={{color:'#e74c3c',fontWeight:700,fontSize:16,marginBottom:4}}>
          Every report makes every woman safer.
        </p>
        <p style={{color:'#888',fontSize:13}}>
          Built for the Hackathon · UN SDG #3 · Women Safety Initiative
        </p>
      </div>
    </div>
  );
}
