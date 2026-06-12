import React from 'react';
import SOSButton from '../components/SOSButton';

export default function SOSPage() {
  return (
    <div className="page">
      <div className="card">
        <h2>🚨 Emergency SOS</h2>
        <p style={{color:'#888', fontSize:13, marginBottom:4}}>
          Tap SOS to alert your trusted contacts with your live location.
          You have 5 seconds to cancel.
        </p>
      </div>
      <div className="card">
        <SOSButton />
      </div>
      <div className="card">
        <h3>How it works</h3>
        <div style={{color:'#aaa', fontSize:13, lineHeight:1.8}}>
          <p>1. Tap the SOS button</p>
          <p>2. 5-second countdown starts (tap Cancel to abort)</p>
          <p>3. Your GPS location is captured</p>
          <p>4. All trusted contacts receive an SMS alert with your location</p>
          <p>5. Tap "I'm Safe" once the situation is resolved</p>
        </div>
      </div>
    </div>
  );
}
