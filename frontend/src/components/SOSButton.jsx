import React, { useState, useRef, useEffect } from 'react';
import { sosAPI, contactsAPI } from '../services/api';

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0,0.2,0.4,0.7,1.0,1.3,1.7,1.9,2.1].forEach((t,i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = 'square';
      const dur = i>=3&&i<=5 ? 0.25 : 0.12;
      gain.gain.setValueAtTime(0.3, ctx.currentTime+t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+t+dur);
      osc.start(ctx.currentTime+t); osc.stop(ctx.currentTime+t+dur);
    });
  } catch(e) {}
}

function sendOfflineSOS(contacts, userName, lat, lng) {
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const msg = encodeURIComponent(
    `🚨 SOS EMERGENCY!\n${userName} needs help NOW!\n📍 Location: ${mapsLink}\nPlease respond immediately!`
  );
  if (contacts.length > 0) {
    const phone = contacts[0].phone?.replace(/[^+\d]/g,'') || '';
    window.open(`sms:${phone}?body=${msg}`, '_blank');
  }
}

export default function SOSButton() {
  const [status, setStatus] = useState('idle');
  const [countdown, setCountdown] = useState(5);
  const [alertId, setAlertId] = useState(null);
  const [info, setInfo] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [contacts, setContacts] = useState([]);
  const timerRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{"id":1,"name":"User"}');

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    contactsAPI.getAll(user.id).then(r => setContacts(r.data||[])).catch(()=>{});
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const startSOS = () => {
    playAlertSound();
    setStatus('countdown');
    setCountdown(5);
    let count = 5;
    timerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timerRef.current);
        triggerSOS();
      }
    }, 1000);
  };

  const cancelSOS = () => {
    clearInterval(timerRef.current);
    setStatus('idle'); setCountdown(5); setInfo('');
  };

  const getLocation = () => new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej, {timeout:6000})
  );

  const triggerSOS = async () => {
    let lat = 12.9716, lng = 77.5946;
    try {
      const pos = await getLocation();
      lat = pos.coords.latitude; lng = pos.coords.longitude;
    } catch(e) {}

    if (isOffline || !navigator.onLine) {
      setStatus('offline_sos');
      setInfo(`No internet — opening SMS app with your location`);
      playAlertSound();
      sendOfflineSOS(contacts, user.name, lat, lng);
      return;
    }

    try {
      const r = await sosAPI.trigger({
        user_id: user.id, latitude: lat, longitude: lng
      });
      setAlertId(r.data.alert_id);
      setStatus('active');
      setInfo(
        `✅ ${r.data.contacts_notified} contact(s) notified\n` +
        `📧 ${r.data.email_sent||0} email · ` +
        `💬 ${r.data.whatsapp_sent||0} WhatsApp · ` +
        `📞 ${r.data.calls_made||0} voice call`
      );
      playAlertSound();
    } catch(e) {
      setStatus('offline_sos');
      setInfo('Network error — using SMS fallback');
      sendOfflineSOS(contacts, user.name, lat, lng);
    }
  };

  const resolveAlert = async () => {
    if (alertId) await sosAPI.resolve(alertId).catch(()=>{});
    setStatus('safe');
    setTimeout(() => { setStatus('idle'); setInfo(''); }, 3000);
  };

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'20px 0'}}>
      {isOffline && (
        <div style={{background:'#2b1f0a',border:'1px solid #f39c12',
          borderRadius:8,padding:'8px 16px',fontSize:12,color:'#f39c12'}}>
          ⚠️ Offline mode — SOS will use SMS fallback
        </div>
      )}

      {status === 'idle' && (
        <>
          <button onClick={startSOS}
            style={{width:180,height:180,borderRadius:'50%',
              background:'radial-gradient(circle,#e74c3c,#a93226)',
              border:'6px solid #922b21',color:'#fff',
              fontSize:32,fontWeight:900,cursor:'pointer',
              boxShadow:'0 0 0 12px rgba(231,76,60,0.2),0 0 40px rgba(231,76,60,0.4)',
              letterSpacing:2, transition:'transform 0.1s'}}
            onMouseDown={e=>e.currentTarget.style.transform='scale(0.96)'}
            onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
            SOS
          </button>
          <p style={{color:'#888',fontSize:13,textAlign:'center',maxWidth:260}}>
            Press SOS to alert trusted contacts via Email + WhatsApp + Voice Call
            {isOffline && <><br/><span style={{color:'#f39c12'}}>Offline: SMS fallback ready</span></>}
          </p>
        </>
      )}

      {status === 'countdown' && (
        <>
          <button style={{width:180,height:180,borderRadius:'50%',
            background:'radial-gradient(circle,#e74c3c,#a93226)',
            border:'6px solid #922b21',color:'#fff',fontSize:72,
            fontWeight:900,cursor:'default',
            animation:'pulse 0.5s infinite alternate',
            boxShadow:'0 0 0 20px rgba(231,76,60,0.3)'}}>
            {countdown}
          </button>
          <p style={{color:'#e74c3c',fontWeight:700,fontSize:16}}>
            Sending SOS in {countdown} seconds...
          </p>
          <button onClick={cancelSOS}
            style={{padding:'12px 32px',borderRadius:8,
              border:'1px solid #555',background:'#333',
              color:'#fff',cursor:'pointer',fontSize:15}}>
            ✕ Cancel
          </button>
        </>
      )}

      {status === 'active' && (
        <>
          <div style={{width:180,height:180,borderRadius:'50%',
            background:'radial-gradient(circle,#e74c3c,#a93226)',
            border:'6px solid #922b21',display:'flex',
            alignItems:'center',justifyContent:'center',
            animation:'pulse 1s infinite alternate'}}>
            <span style={{fontSize:52}}>🚨</span>
          </div>
          <p style={{color:'#e74c3c',fontWeight:700,fontSize:16,textAlign:'center'}}>
            ALERT ACTIVE — Help is on the way!
          </p>
          <div style={{background:'#0a2b15',border:'1px solid #27ae6055',
            borderRadius:10,padding:12,textAlign:'center',maxWidth:320}}>
            {info.split('\n').map((line,i) => (
              <p key={i} style={{color:'#27ae60',fontSize:13,margin:'2px 0'}}>{line}</p>
            ))}
          </div>
          <button onClick={resolveAlert}
            style={{padding:'14px 36px',borderRadius:10,border:'none',
              background:'#27ae60',color:'#fff',fontWeight:700,
              fontSize:16,cursor:'pointer',marginTop:8}}>
            ✓ I'm Safe Now
          </button>
        </>
      )}

      {status === 'offline_sos' && (
        <>
          <div style={{width:180,height:180,borderRadius:'50%',
            background:'radial-gradient(circle,#f39c12,#e67e22)',
            border:'6px solid #d68910',display:'flex',
            alignItems:'center',justifyContent:'center'}}>
            <span style={{fontSize:52}}>📱</span>
          </div>
          <p style={{color:'#f39c12',fontWeight:700,fontSize:15,textAlign:'center'}}>
            Offline SOS Activated!
          </p>
          <div style={{background:'#2b1f0a',border:'1px solid #f39c1255',
            borderRadius:10,padding:12,textAlign:'center',maxWidth:300}}>
            <p style={{color:'#f39c12',fontSize:13,margin:0}}>{info}</p>
            <p style={{color:'#888',fontSize:12,marginTop:4}}>
              SMS app opened with pre-filled emergency message
            </p>
          </div>
          <button onClick={()=>setStatus('idle')}
            style={{padding:'12px 28px',borderRadius:8,border:'1px solid #555',
              background:'#333',color:'#fff',cursor:'pointer',fontSize:14}}>
            Back
          </button>
        </>
      )}

      {status === 'safe' && (
        <>
          <div style={{width:180,height:180,borderRadius:'50%',
            background:'radial-gradient(circle,#27ae60,#1e8449)',
            border:'6px solid #1a7a3c',display:'flex',
            alignItems:'center',justifyContent:'center'}}>
            <span style={{fontSize:52}}>✅</span>
          </div>
          <p style={{color:'#27ae60',fontWeight:700,fontSize:16}}>
            You're marked safe. Stay strong! 💚
          </p>
        </>
      )}

      <style>{`
        @keyframes pulse {
          from { box-shadow: 0 0 0 8px rgba(231,76,60,0.4); }
          to { box-shadow: 0 0 0 24px rgba(231,76,60,0.05); }
        }
      `}</style>
    </div>
  );
}
