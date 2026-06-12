import React, { useState, useEffect, useRef } from 'react';
import { incidentsAPI } from '../services/api';

const BENGALURU_PLACES = [
  "Silk Board Junction, Bengaluru",
  "Koramangala 4th Block, Bengaluru",
  "Koramangala 5th Block, Bengaluru",
  "Forum Mall, Koramangala, Bengaluru",
  "MG Road Metro Station, Bengaluru",
  "Brigade Road, Bengaluru",
  "Indiranagar 100 Feet Road, Bengaluru",
  "Indiranagar Metro Station, Bengaluru",
  "Whitefield Main Road, Bengaluru",
  "ITPL Gate, Whitefield, Bengaluru",
  "Majestic Bus Stand, Bengaluru",
  "Majestic Railway Station, Bengaluru",
  "Electronic City Phase 1, Bengaluru",
  "HSR Layout Sector 1, Bengaluru",
  "BTM Layout 2nd Stage, Bengaluru",
  "Jayanagar 4th Block, Bengaluru",
  "Rajajinagar Main Road, Bengaluru",
  "Yeshwanthpur Railway Station, Bengaluru",
  "Marathahalli Bridge, Bengaluru",
  "Marathahalli Bus Stand, Bengaluru",
  "Hebbal Flyover, Bengaluru",
  "KR Puram Railway Station, Bengaluru",
  "Banashankari Bus Stand, Bengaluru",
  "Jayanagar Shopping Complex, Bengaluru",
  "Richmond Road, Bengaluru",
  "Residency Road, Bengaluru",
  "Commercial Street, Bengaluru",
  "Shivajinagar Bus Stand, Bengaluru",
  "Vijayanagar Main Road, Bengaluru",
  "JP Nagar 7th Phase, Bengaluru",
];

const PLACE_COORDS = {
  "Silk Board Junction, Bengaluru": [12.9172, 77.6230],
  "Koramangala 4th Block, Bengaluru": [12.9352, 77.6245],
  "Forum Mall, Koramangala, Bengaluru": [12.9355, 77.6248],
  "MG Road Metro Station, Bengaluru": [12.9757, 77.6011],
  "Whitefield Main Road, Bengaluru": [12.9698, 77.7499],
  "ITPL Gate, Whitefield, Bengaluru": [12.9700, 77.7502],
  "Majestic Bus Stand, Bengaluru": [12.9767, 77.5713],
  "Majestic Railway Station, Bengaluru": [12.9770, 77.5716],
  "Electronic City Phase 1, Bengaluru": [12.8451, 77.6602],
  "Indiranagar 100 Feet Road, Bengaluru": [12.9784, 77.6408],
  "Marathahalli Bridge, Bengaluru": [12.9591, 77.6974],
  "Yeshwanthpur Railway Station, Bengaluru": [13.0275, 77.5540],
  "BTM Layout 2nd Stage, Bengaluru": [12.9166, 77.6101],
  "HSR Layout Sector 1, Bengaluru": [12.9116, 77.6474],
};

export default function ReportPage() {
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [incidentType, setIncidentType] = useState('unsafe_area');
  const [severity, setSeverity] = useState(2);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{"id":1}');
  const inputRef = useRef();

  useEffect(() => {
    if (locationInput.length < 2) { setSuggestions([]); return; }
    const filtered = BENGALURU_PLACES.filter(p =>
      p.toLowerCase().includes(locationInput.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 6));
    setShowSuggestions(true);
  }, [locationInput]);

  const handleSelectPlace = (place) => {
    setLocationInput(place);
    setSelectedLocation(place);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowConfirm(true);
  };

  const submit = async () => {
    setLoading(true); setStatus('');
    let lat, lng;
    if (selectedLocation && PLACE_COORDS[selectedLocation]) {
      [lat, lng] = PLACE_COORDS[selectedLocation];
    } else {
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, {timeout:6000})
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        lat = 12.9716; lng = 77.5946;
      }
    }
    try {
      await incidentsAPI.report({
        reporter_id: user.id,
        latitude: lat,
        longitude: lng,
        incident_type: incidentType,
        severity: parseInt(severity),
        description: selectedLocation
          ? `[Location: ${selectedLocation}] ${description}`
          : description,
        time_of_day: new Date().getHours(),
      });
      setStatus('success');
      setLocationInput(''); setSelectedLocation(null);
      setDescription(''); setSeverity(2); setShowConfirm(false);
      setIncidentType('unsafe_area');
    } catch(e) { setStatus('error'); }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="card">
        <h2>📍 Report an Unsafe Area</h2>
        <p style={{color:'#888',fontSize:13,marginBottom:16}}>
          Your review helps the ML model set the correct zone color on the safety map.
          More reports = smarter heatmap for everyone.
        </p>

        {status==='success' && (
          <div className="alert-box alert-success">
            ✅ Report submitted! The heatmap will update with your review.
          </div>
        )}
        {status==='error' && (
          <div className="alert-box alert-error">✗ Failed to submit. Try again.</div>
        )}

        <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>
          🔍 Search Location / Area
        </label>
        <div style={{position:'relative',marginBottom:showSuggestions&&suggestions.length?0:12}}>
          <input
            ref={inputRef}
            placeholder="Type a place, junction, bus stop..."
            value={locationInput}
            onChange={e => { setLocationInput(e.target.value); setSelectedLocation(null); setShowConfirm(false); }}
            onFocus={() => suggestions.length && setShowSuggestions(true)}
            style={{width:'100%',marginBottom:0}}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#1a1a2e',
              border:'1px solid #333',borderRadius:'0 0 10px 10px',zIndex:1000,overflow:'hidden'}}>
              {suggestions.map((s,i) => (
                <div key={i} onClick={() => handleSelectPlace(s)}
                  style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #0f0f1a',
                    color:'#ccc',fontSize:13,display:'flex',alignItems:'center',gap:8}}
                  onMouseEnter={e=>e.target.style.background='#2a2a4a'}
                  onMouseLeave={e=>e.target.style.background='transparent'}>
                  <span style={{color:'#e74c3c'}}>📍</span> {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {showConfirm && selectedLocation && (
          <div style={{background:'#0a2b15',border:'1px solid #27ae6055',borderRadius:10,
            padding:12,marginBottom:12,marginTop:8}}>
            <p style={{color:'#27ae60',fontSize:13,fontWeight:600,marginBottom:2}}>
              📍 Selected: {selectedLocation}
            </p>
            <p style={{color:'#888',fontSize:12,margin:0}}>
              Do you want to suggest this as an unsafe zone and make others aware?
            </p>
          </div>
        )}

        <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4,marginTop:8}}>What happened here?</label>
        <select value={incidentType} onChange={e=>setIncidentType(e.target.value)}
          style={{width:'100%',padding:'9px 12px',background:'#0f0f1a',border:'1px solid #333',
            borderRadius:8,color:'#fff',marginBottom:12}}>
          <option value="unsafe_area">🔴 Unsafe Area (general)</option>
          <option value="poor_lighting">🌑 Poor Lighting / Dark</option>
          <option value="harassment">😰 Harassment</option>
          <option value="stalking">👣 Stalking / Being Followed</option>
          <option value="assault">⚠️ Physical Threat / Assault</option>
        </select>

        <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:8}}>How serious?</label>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
          {[1,2,3].map(s => (
            <button key={s} onClick={()=>setSeverity(s)}
              style={{padding:'10px 4px',borderRadius:8,
                border:`2px solid ${severity===s?'#e74c3c':'#333'}`,
                background:severity===s?'#2b0a0a':'#0f0f1a',
                color:severity===s?'#e74c3c':'#888',cursor:'pointer',textAlign:'center'}}>
              {'⚠️'.repeat(s)}<br/>
              <span style={{fontSize:11}}>{s===1?'Low':s===2?'Medium':'High'}</span>
            </button>
          ))}
        </div>

        <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>
          Your experience <span style={{color:'#555'}}>(helps others)</span>
        </label>
        <textarea rows={3}
          placeholder="e.g. Very dark at night near the underpass. No lights. Felt unsafe walking alone after 9pm..."
          value={description} onChange={e=>setDescription(e.target.value)}
          style={{width:'100%',padding:'9px 12px',background:'#0f0f1a',border:'1px solid #333',
            borderRadius:8,color:'#fff',marginBottom:16,resize:'none',outline:'none'}}/>

        <button className="btn btn-primary" style={{width:'100%',padding:13,fontSize:15}}
          onClick={submit} disabled={loading}>
          {loading?'Submitting...':'🚨 Submit Review & Update Safety Map'}
        </button>
      </div>
    </div>
  );
}
