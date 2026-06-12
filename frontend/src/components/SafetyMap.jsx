import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { heatmapAPI, incidentsAPI } from '../services/api';

const TYPE_COLORS = {
  harassment: '#e74c3c',
  stalking: '#e67e22',
  assault: '#c0392b',
  unsafe_area: '#f39c12',
  poor_lighting: '#7f8c8d',
};
const RISK_COLORS = { high:'#e74c3c', medium:'#f39c12', low:'#2ecc71', safe:'#3498db' };
const RISK_BG = { high:'#2b0a0a', medium:'#2b1f0a', low:'#0a2b15', safe:'#0a1a2b' };

function HeatLayer({ points }) {
  const map = useMap();
  const ref = useRef(null);

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    const draw = () => {
      if (ref.current && ref.current.parentNode) {
        ref.current.parentNode.removeChild(ref.current);
        ref.current = null;
      }
      const pane = map.getPanes().overlayPane;
      if (!pane) return;
      const mapSize = map.getSize();
      const canvas = document.createElement('canvas');
      canvas.width = mapSize.x;
      canvas.height = mapSize.y;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '500';
      canvas.style.opacity = '0.8';
      pane.appendChild(canvas);
      ref.current = canvas;
      const ctx = canvas.getContext('2d');
      points.forEach(p => {
        try {
          const pt = map.latLngToContainerPoint([p.lat, p.lng]);
          const radius = 60;
          const grd = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, radius);
          const i = p.intensity || 0.5;
          if (i > 0.65) {
            grd.addColorStop(0, 'rgba(192,57,43,1)');
            grd.addColorStop(0.4, 'rgba(231,76,60,0.6)');
            grd.addColorStop(1, 'rgba(231,76,60,0)');
          } else if (i > 0.35) {
            grd.addColorStop(0, 'rgba(243,156,18,1)');
            grd.addColorStop(0.4, 'rgba(243,156,18,0.6)');
            grd.addColorStop(1, 'rgba(243,156,18,0)');
          } else {
            grd.addColorStop(0, 'rgba(52,152,219,0.9)');
            grd.addColorStop(0.4, 'rgba(52,152,219,0.5)');
            grd.addColorStop(1, 'rgba(52,152,219,0)');
          }
          ctx.beginPath();
          ctx.fillStyle = grd;
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
          ctx.fill();
        } catch(e) {}
      });
    };

    const timer = setTimeout(draw, 300);
    map.on('moveend zoomend', draw);
    return () => {
      clearTimeout(timer);
      map.off('moveend zoomend', draw);
      if (ref.current && ref.current.parentNode) {
        ref.current.parentNode.removeChild(ref.current);
        ref.current = null;
      }
    };
  }, [points, map]);

  return null;
}

function MapClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
}

/* ── TIME LABEL helper ── */
function timeLabel(h) {
  if (h === null || h === undefined) return '🕐 Time unknown';
  const hour = parseInt(h, 10);
  if (hour >= 5  && hour < 12) return `🌅 Morning (${hour}:00)`;
  if (hour >= 12 && hour < 17) return `☀️ Afternoon (${hour}:00)`;
  if (hour >= 17 && hour < 20) return `🌆 Evening (${hour}:00)`;
  return `🌙 Night (${hour}:00) — High Risk`;
}

/* ── LOCATION PANEL ── */
function LocationPanel({ latlng, onClose, onReport }) {
  const [data, setData]       = useState(null);
  const [riskData, setRisk]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      incidentsAPI.getLocationHistory(latlng.lat, latlng.lng),
      heatmapAPI.getRiskScore(latlng.lat, latlng.lng)
    ]).then(([h, r]) => {
      setData(h.data);
      setRisk(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [latlng]);

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:9999,
      display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:'#1a1a2e',borderRadius:'16px 16px 0 0',padding:20,
        width:'100%',maxWidth:500,maxHeight:'88vh',overflowY:'auto',border:'1px solid #333'}}>

        {/* header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
          <h3 style={{color:'#fff',fontSize:16}}>📍 Area Safety Report</h3>
          <button onClick={onClose}
            style={{background:'none',border:'none',color:'#aaa',fontSize:22,cursor:'pointer'}}>✕</button>
        </div>
        <p style={{color:'#555',fontSize:11,marginBottom:16}}>
          {latlng.lat.toFixed(5)}, {latlng.lng.toFixed(5)}
        </p>

        {loading && (
          <p style={{textAlign:'center',color:'#888',padding:24}}>⏳ Analysing area safety...</p>
        )}

        {/* ML risk badge */}
        {!loading && riskData && (
          <div style={{background:RISK_BG[riskData.risk_level],
            border:`1px solid ${RISK_COLORS[riskData.risk_level]}`,
            borderRadius:10,padding:14,marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{color:RISK_COLORS[riskData.risk_level],fontWeight:700,fontSize:15}}>
                {riskData.risk_level==='safe' ? '✅ Safe Zone'
                 : riskData.risk_level==='low' ? '🟢 Low Risk'
                 : riskData.risk_level==='medium' ? '🟡 Medium Risk'
                 : '🔴 High Risk'}
              </span>
              <span style={{color:RISK_COLORS[riskData.risk_level],fontSize:24,fontWeight:900}}>
                {riskData.ml_score}%
              </span>
            </div>
            <div style={{background:'#111',borderRadius:20,height:8,overflow:'hidden',marginBottom:6}}>
              <div style={{width:`${riskData.ml_score}%`,height:'100%',
                background:RISK_COLORS[riskData.risk_level],
                borderRadius:20,transition:'width 1s'}}/>
            </div>
            <p style={{color:'#666',fontSize:11,margin:0}}>
              🤖 ML Risk Score · {riskData.report_count} community report(s) within 1.5 km
            </p>
          </div>
        )}

        {/* community verdict */}
        {!loading && data && (
          <>
            <div style={{background:RISK_BG[data.risk_level||'safe'],
              border:`1px solid ${RISK_COLORS[data.risk_level||'safe']}44`,
              borderRadius:10,padding:12,marginBottom:14}}>
              <p style={{color:RISK_COLORS[data.risk_level||'safe'],
                fontWeight:600,fontSize:14,marginBottom:6}}>
                {data.community_verdict}
              </p>
              {data.total > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {Object.entries(data.type_breakdown||{}).map(([type,count]) => (
                    <span key={type} style={{padding:'3px 10px',borderRadius:20,fontSize:11,
                      background:TYPE_COLORS[type]+'22',
                      border:`1px solid ${TYPE_COLORS[type]}44`,
                      color:TYPE_COLORS[type]}}>
                      {type.replace('_',' ')} ×{count}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── INCIDENT LIST with time + description ── */}
            {data.incidents && data.incidents.length > 0 ? (
              <>
                <p style={{color:'#555',fontSize:11,textTransform:'uppercase',
                  letterSpacing:1,marginBottom:8}}>
                  Recent Reports Near This Location
                </p>

                {data.incidents.map((inc, i) => {
                  /* parse landmark from description */
                  let landmark = '';
                  let userText = inc.description || '';
                  const lmMatch = userText.match(/\[Landmark:\s*([^\]]+)\]/);
                  const locMatch = userText.match(/\[Location:\s*([^\]]+)\]/);
                  if (lmMatch)  { landmark = lmMatch[1];  userText = userText.replace(lmMatch[0], '').trim(); }
                  if (locMatch) { landmark = locMatch[1]; userText = userText.replace(locMatch[0], '').trim(); }

                  return (
                    <div key={i} style={{background:'#0f0f1a',borderRadius:10,
                      padding:13,marginBottom:10,
                      borderLeft:`4px solid ${TYPE_COLORS[inc.type]||'#888'}`}}>

                      {/* type + date row */}
                      <div style={{display:'flex',justifyContent:'space-between',
                        alignItems:'center',marginBottom:6}}>
                        <span style={{color:TYPE_COLORS[inc.type],fontSize:13,
                          fontWeight:700,textTransform:'capitalize'}}>
                          {inc.type.replace('_',' ')}
                        </span>
                        <span style={{color:'#555',fontSize:11}}>
                          {new Date(inc.reported_at).toLocaleDateString('en-IN',
                            {day:'2-digit',month:'short',year:'numeric'})}
                        </span>
                      </div>

                      {/* severity */}
                      <div style={{fontSize:13,marginBottom:6}}>
                        {'⚠️'.repeat(inc.severity)}
                        <span style={{color:'#666',fontSize:11,marginLeft:6}}>
                          {inc.severity===1?'Low severity':
                           inc.severity===2?'Medium severity':'High severity'}
                        </span>
                      </div>

                      {/* TIME OF INCIDENT */}
                      <div style={{display:'inline-block',
                        background:'#1a1a2e',border:'1px solid #2a2a4a',
                        borderRadius:20,padding:'3px 12px',
                        fontSize:12,color:'#aaa',marginBottom:8}}>
                        {timeLabel(inc.time_of_day)}
                      </div>

                      {/* landmark */}
                      {landmark && (
                        <div style={{fontSize:12,color:'#f39c12',marginBottom:4}}>
                          📌 {landmark}
                        </div>
                      )}

                      {/* description */}
                      {userText && userText.length > 2 && (
                        <div style={{background:'#1a1a2e',borderRadius:8,
                          padding:'8px 10px',fontSize:12,
                          color:'#ccc',fontStyle:'italic',
                          borderLeft:'2px solid #333'}}>
                          "{userText}"
                        </div>
                      )}

                      {/* fallback when no description */}
                      {(!userText || userText.length <= 2) && !landmark && (
                        <div style={{color:'#444',fontSize:11,fontStyle:'italic'}}>
                          No additional details provided.
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              /* no incidents nearby */
              <div style={{background:'#0a2b15',border:'1px solid #27ae6033',
                borderRadius:10,padding:16,textAlign:'center',marginBottom:14}}>
                <div style={{fontSize:28,marginBottom:8}}>✅</div>
                <p style={{color:'#27ae60',fontWeight:600,marginBottom:4}}>
                  No incidents reported nearby
                </p>
                <p style={{color:'#888',fontSize:12,margin:0}}>
                  This area looks safe. Be the first to report if you notice anything unusual.
                </p>
              </div>
            )}

            <button onClick={() => onReport(latlng)}
              style={{width:'100%',padding:14,borderRadius:10,border:'none',
                background:'#e74c3c',color:'#fff',fontWeight:700,
                fontSize:15,cursor:'pointer',marginTop:8}}>
              ✍️ Add My Review for This Area
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── REPORT MODAL ── */
function ReportModal({ latlng, onClose, onSubmit }) {
  const [incidentType, setIncidentType] = useState('unsafe_area');
  const [severity, setSeverity]         = useState(2);
  const [description, setDescription]   = useState('');
  const [landmark, setLandmark]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [done, setDone]                 = useState(false);

  const submit = async () => {
    setLoading(true);
    await onSubmit({
      incident_type: incidentType,
      severity: parseInt(severity),
      description: landmark
        ? `[Landmark: ${landmark}] ${description}`
        : description,
      latitude: latlng.lat,
      longitude: latlng.lng,
      time_of_day: new Date().getHours()
    });
    setLoading(false);
    setDone(true);
    setTimeout(onClose, 2000);
  };

  if (done) return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',
      zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#1a1a2e',borderRadius:16,padding:32,
        textAlign:'center',border:'1px solid #27ae60',maxWidth:300}}>
        <div style={{fontSize:52}}>✅</div>
        <p style={{color:'#27ae60',fontWeight:700,marginTop:12,fontSize:16}}>
          Review submitted!
        </p>
        <p style={{color:'#888',fontSize:13,marginTop:4}}>
          ML model will update zone colour based on community reviews.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',
      zIndex:99999,display:'flex',alignItems:'center',
      justifyContent:'center',padding:16}}>
      <div style={{background:'#1a1a2e',borderRadius:16,padding:24,
        width:'100%',maxWidth:400,border:'1px solid #e74c3c55',
        maxHeight:'92vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',
          alignItems:'center',marginBottom:4}}>
          <h3 style={{color:'#e74c3c',fontSize:16}}>✍️ Review This Area</h3>
          <button onClick={onClose}
            style={{background:'none',border:'none',color:'#888',
              fontSize:20,cursor:'pointer'}}>✕</button>
        </div>
        <p style={{color:'#555',fontSize:11,marginBottom:12}}>
          📌 {latlng.lat.toFixed(5)}, {latlng.lng.toFixed(5)} · Reported at {new Date().getHours()}:00
        </p>
        <div style={{background:'#0f0f1a',borderRadius:8,padding:10,
          marginBottom:14,border:'1px solid #27ae6033'}}>
          <p style={{color:'#27ae60',fontSize:12,margin:0}}>
            💡 Your review updates the ML risk score and heatmap colour for this area.
          </p>
        </div>

        <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>
          📌 Nearby Landmark
        </label>
        <input placeholder="e.g. Silk Board Junction, MG Road Metro"
          value={landmark} onChange={e=>setLandmark(e.target.value)}
          style={{width:'100%',padding:'9px 12px',background:'#0f0f1a',
            border:'1px solid #333',borderRadius:8,color:'#fff',
            marginBottom:12,outline:'none'}}/>

        <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>
          What happened?
        </label>
        <select value={incidentType} onChange={e=>setIncidentType(e.target.value)}
          style={{width:'100%',padding:'9px 12px',background:'#0f0f1a',
            border:'1px solid #333',borderRadius:8,color:'#fff',marginBottom:12}}>
          <option value="unsafe_area">🔴 Unsafe Area</option>
          <option value="poor_lighting">🌑 Poor Lighting</option>
          <option value="harassment">😰 Harassment</option>
          <option value="stalking">👣 Stalking</option>
          <option value="assault">⚠️ Physical Threat</option>
        </select>

        <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:8}}>
          Severity
        </label>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
          {[1,2,3].map(s => (
            <button key={s} onClick={()=>setSeverity(s)}
              style={{padding:'10px 4px',borderRadius:8,
                border:`2px solid ${severity===s?'#e74c3c':'#333'}`,
                background:severity===s?'#2b0a0a':'#0f0f1a',
                color:severity===s?'#e74c3c':'#888',
                cursor:'pointer',textAlign:'center',fontSize:12}}>
              {'⚠️'.repeat(s)}<br/>
              <span style={{fontSize:10}}>
                {s===1?'Low':s===2?'Medium':'High'}
              </span>
            </button>
          ))}
        </div>

        <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>
          Your experience
        </label>
        <textarea rows={3}
          placeholder="What happened? e.g. Very dark near the underpass at 10pm, no streetlights..."
          value={description} onChange={e=>setDescription(e.target.value)}
          style={{width:'100%',padding:'9px 12px',background:'#0f0f1a',
            border:'1px solid #333',borderRadius:8,color:'#fff',
            marginBottom:16,resize:'none',outline:'none'}}/>

        <div style={{display:'flex',gap:8}}>
          <button onClick={onClose}
            style={{flex:1,padding:11,borderRadius:8,border:'1px solid #444',
              background:'transparent',color:'#aaa',cursor:'pointer'}}>
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            style={{flex:2,padding:11,borderRadius:8,border:'none',
              background:'#e74c3c',color:'#fff',fontWeight:700,cursor:'pointer'}}>
            {loading?'Saving...':'🚨 Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ── */
export default function SafetyMap({ userLocation }) {
  const [heatPoints, setHeatPoints]       = useState([]);
  const [incidents, setIncidents]         = useState([]);
  const [selectedLatLng, setSelectedLatLng] = useState(null);
  const [reportLatLng, setReportLatLng]   = useState(null);
  const [showPanel, setShowPanel]         = useState(false);
  const center = userLocation || [12.9716, 77.5946];
  const user   = JSON.parse(localStorage.getItem('user') || '{"id":1}');

  const loadData = useCallback(() => {
    const [lat, lng] = center;
    heatmapAPI.getGrid(lat, lng, 15)
      .then(r => setHeatPoints(r.data.heatmap || []))
      .catch(()=>{});
    incidentsAPI.getNearby(lat, lng, 15)
      .then(r => setIncidents(r.data || []))
      .catch(()=>{});
  }, [center]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div>
      <div style={{background:'#1a1a2e',border:'1px solid #e74c3c33',
        borderRadius:8,padding:'8px 14px',marginBottom:10,
        fontSize:13,display:'flex',gap:8,alignItems:'center'}}>
        <span>💡</span>
        <span style={{color:'#aaa'}}>
          Tap anywhere on the map → AI safety score + community reviews + add your review
        </span>
      </div>

      <MapContainer center={center} zoom={13}
        style={{width:'100%',height:'62vh',borderRadius:12}}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"/>
        {heatPoints.length > 0 && <HeatLayer points={heatPoints} />}
        <MapClickHandler onClick={(latlng) => {
          setSelectedLatLng(latlng);
          setShowPanel(true);
          setReportLatLng(null);
        }}/>
        {incidents.map(inc => (
          <CircleMarker key={inc.id}
            center={[inc.latitude, inc.longitude]}
            radius={8}
            pathOptions={{
              color: TYPE_COLORS[inc.type]||'#888',
              fillColor: TYPE_COLORS[inc.type]||'#888',
              fillOpacity: 0.9, weight: 2
            }}>
            <Popup>
              <div style={{minWidth:160}}>
                <strong style={{textTransform:'capitalize',
                  color:TYPE_COLORS[inc.type]||'#333'}}>
                  {inc.type?.replace('_',' ')}
                </strong><br/>
                {'⚠️'.repeat(inc.severity)}<br/>
                <span style={{fontSize:11,color:'#888'}}>
                  {timeLabel(inc.time_of_day)}
                </span><br/>
                {inc.description && (
                  <em style={{fontSize:11,color:'#555'}}>
                    "{inc.description}"
                  </em>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}>
        {Object.entries(TYPE_COLORS).map(([type,color]) => (
          <div key={type} style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:color}}/>
            <span style={{color:'#aaa',fontSize:11}}>{type.replace('_',' ')}</span>
          </div>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <div style={{width:30,height:10,borderRadius:3,
            background:'linear-gradient(to right,#3498db,#f39c12,#e74c3c)'}}/>
          <span style={{color:'#aaa',fontSize:11}}>risk level</span>
        </div>
      </div>

      {showPanel && selectedLatLng && (
        <LocationPanel
          latlng={selectedLatLng}
          onClose={() => setShowPanel(false)}
          onReport={(latlng) => {
            setShowPanel(false);
            setReportLatLng(latlng);
          }}
        />
      )}
      {reportLatLng && (
        <ReportModal
          latlng={reportLatLng}
          onClose={() => setReportLatLng(null)}
          onSubmit={async (data) => {
            try {
              await incidentsAPI.report({ reporter_id: user.id, ...data });
              loadData();
            } catch(e) { console.error(e); }
          }}
        />
      )}
    </div>
  );
}
