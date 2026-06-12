import React, { useState, useEffect } from 'react';
import SafetyMap from '../components/SafetyMap';

const BENGALURU = [12.9716, 77.5946];

export default function Home() {
  const [location, setLocation] = useState(BENGALURU);
  const [locLabel, setLocLabel] = useState('Bengaluru');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Always show Bengaluru first, then update if user is nearby
    setLocation(BENGALURU);
    setTimeout(() => setReady(true), 150);

    navigator.geolocation?.getCurrentPosition(
      p => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        // Only use user location if they're in Karnataka/nearby
        if (lat > 11 && lat < 15 && lng > 74 && lng < 80) {
          setLocation([lat, lng]);
          setLocLabel('Your Live Location');
        } else {
          setLocLabel('Bengaluru (demo)');
        }
      },
      () => setLocLabel('Bengaluru (demo)'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return (
    <div className="page" style={{paddingTop:12}}>
      <div style={{display:'flex',justifyContent:'space-between',
        alignItems:'center',marginBottom:12}}>
        <div>
          <h2 style={{color:'#fff',fontSize:18,fontWeight:700}}>
            🗺️ Live Safety Map
          </h2>
          <p style={{color:'#666',fontSize:12}}>
            📍 {locLabel} · Tap map to check any area
          </p>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:11,color:'#888'}}>AI-powered</div>
          <div style={{fontSize:11,color:'#27ae60'}}>● Live</div>
        </div>
      </div>
      {ready ? (
        <SafetyMap userLocation={location} />
      ) : (
        <div style={{height:'62vh',borderRadius:12,background:'#1a1a2e',
          display:'flex',alignItems:'center',justifyContent:'center',
          border:'1px solid #2a2a4a'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:12}}>🗺️</div>
            <p style={{color:'#888'}}>Loading Safety Map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
