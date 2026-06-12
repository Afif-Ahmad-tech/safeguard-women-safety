import React, { useState, useEffect, useCallback } from 'react';
import { contactsAPI } from '../services/api';

const COUNTRY_CODES = [
  { code:'+91', name:'India', flag:'🇮🇳', digits:10, pattern:/^[6-9]\d{9}$/, hint:'10 digits starting with 6-9' },
  { code:'+1', name:'USA/Canada', flag:'🇺🇸', digits:10, pattern:/^\d{10}$/, hint:'10 digits' },
  { code:'+44', name:'UK', flag:'🇬🇧', digits:10, pattern:/^\d{10}$/, hint:'10 digits' },
  { code:'+61', name:'Australia', flag:'🇦🇺', digits:9, pattern:/^\d{9}$/, hint:'9 digits' },
  { code:'+971', name:'UAE', flag:'🇦🇪', digits:9, pattern:/^\d{9}$/, hint:'9 digits' },
  { code:'+65', name:'Singapore', flag:'🇸🇬', digits:8, pattern:/^\d{8}$/, hint:'8 digits' },
];

const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [email, setEmail] = useState('');
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{"id":1}');
  const country = COUNTRY_CODES.find(c => c.code === countryCode);

  const load = useCallback(() => {
    contactsAPI.getAll(user.id).then(r => setContacts(r.data || [])).catch(()=>{});
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const validate = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Enter a valid full name';
    if (!phone.trim()) {
      e.phone = 'Phone number is required';
    } else if (!country.pattern.test(phone.replace(/\s/g,''))) {
      e.phone = `Enter a valid ${country.digits}-digit number for ${country.name}. ${country.hint}`;
    }
    if (email && !validateEmail(email)) e.email = 'Enter a valid email address (e.g. name@gmail.com)';
    if (!notifySms && !notifyEmail) e.notify = 'Choose at least one notification method';
    if (notifyEmail && !email) e.email = 'Email is required when email notification is enabled';
    return e;
  };

  const add = async () => {
    setStatus('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      await contactsAPI.add({
        user_id: user.id,
        name: name.trim(),
        phone: countryCode + phone.trim(),
        email: email.trim() || null,
        notify_via_sms: notifySms,
        notify_via_email: notifyEmail,
      });
      setName(''); setPhone(''); setEmail('');
      setNotifySms(true); setNotifyEmail(true);
      setErrors({}); setStatus('success');
      load();
    } catch(e) { setStatus('error'); }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>👥 Trusted Contacts</h2>
        <p style={{color:'#888',fontSize:13,marginBottom:16}}>
          These people receive an SMS and/or email with your live GPS location when you trigger SOS.
        </p>
        {contacts.length === 0
          ? <p style={{color:'#555',fontSize:13,textAlign:'center',padding:20}}>No contacts yet. Add someone you trust below.</p>
          : contacts.map(c => (
            <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:14,background:'#0f0f1a',borderRadius:10,marginBottom:8,border:'1px solid #2a2a4a'}}>
              <div>
                <div style={{color:'#fff',fontWeight:600,fontSize:14}}>{c.name}</div>
                <div style={{color:'#888',fontSize:12,marginTop:2}}>📱 {c.phone}</div>
                {c.email && <div style={{color:'#888',fontSize:12}}>✉️ {c.email}</div>}
                <div style={{display:'flex',gap:6,marginTop:4}}>
                  {c.notify_via_sms && <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#27ae6022',color:'#27ae60',border:'1px solid #27ae6044'}}>SMS</span>}
                  {c.notify_via_email && <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#3498db22',color:'#3498db',border:'1px solid #3498db44'}}>Email</span>}
                </div>
              </div>
              <button onClick={()=>contactsAPI.delete(c.id).then(load)}
                style={{padding:'6px 14px',borderRadius:8,border:'1px solid #e74c3c44',
                  background:'#2b0a0a',color:'#e74c3c',cursor:'pointer',fontSize:12}}>
                Remove
              </button>
            </div>
          ))
        }
      </div>

      <div className="card">
        <h3 style={{marginBottom:16}}>+ Add Trusted Contact</h3>
        {status==='success' && <div className="alert-box alert-success">✅ Contact added! They will receive SOS alerts.</div>}
        {status==='error' && <div className="alert-box alert-error">✗ Failed to add. Try again.</div>}

        <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Full Name *</label>
        <input placeholder="e.g. Priya Sharma, Mom, Sister"
          value={name}
          onChange={e=>{setName(e.target.value);setErrors(p=>({...p,name:''}));}}
          style={{borderColor:errors.name?'#e74c3c':'',marginBottom:errors.name?2:12}}/>
        {errors.name && <p style={{color:'#e74c3c',fontSize:11,marginBottom:8}}>⚠ {errors.name}</p>}

        <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Country & Mobile Number *</label>
        <div style={{display:'flex',gap:8,marginBottom:errors.phone?2:4}}>
          <select value={countryCode} onChange={e=>{setCountryCode(e.target.value);setErrors(p=>({...p,phone:''}));}}
            style={{width:180,padding:'10px 8px',background:'#0f0f1a',border:'1px solid #333',
              borderRadius:8,color:'#fff',fontSize:12,flexShrink:0}}>
            {COUNTRY_CODES.map(c=>(
              <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>
            ))}
          </select>
          <input placeholder={`${country.digits} digits`} value={phone}
            onChange={e=>{setPhone(e.target.value.replace(/\D/g,''));setErrors(p=>({...p,phone:''}));}}
            maxLength={country.digits}
            style={{flex:1,borderColor:errors.phone?'#e74c3c':'',marginBottom:0}}/>
        </div>
        <p style={{color:'#555',fontSize:11,marginBottom:errors.phone?2:10}}>
          {country.flag} {country.name}: {country.hint}
        </p>
        {errors.phone && <p style={{color:'#e74c3c',fontSize:11,marginBottom:8}}>⚠ {errors.phone}</p>}

        <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Email Address *</label>
        <input placeholder="e.g. priya@gmail.com" type="email" value={email}
          onChange={e=>{setEmail(e.target.value);setErrors(p=>({...p,email:''}));}}
          style={{borderColor:errors.email?'#e74c3c':'',marginBottom:errors.email?2:12}}/>
        {errors.email && <p style={{color:'#e74c3c',fontSize:11,marginBottom:8}}>⚠ {errors.email}</p>}

        <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:8}}>Notify via *</label>
        <div style={{display:'flex',gap:10,marginBottom:errors.notify?4:16}}>
          <button onClick={()=>setNotifySms(!notifySms)}
            style={{flex:1,padding:'10px 8px',borderRadius:8,
              border:`2px solid ${notifySms?'#27ae60':'#333'}`,
              background:notifySms?'#0a2b15':'#0f0f1a',
              color:notifySms?'#27ae60':'#888',cursor:'pointer',fontSize:13}}>
            📱 SMS {notifySms?'✓':''}
          </button>
          <button onClick={()=>setNotifyEmail(!notifyEmail)}
            style={{flex:1,padding:'10px 8px',borderRadius:8,
              border:`2px solid ${notifyEmail?'#3498db':'#333'}`,
              background:notifyEmail?'#0a1a2b':'#0f0f1a',
              color:notifyEmail?'#3498db':'#888',cursor:'pointer',fontSize:13}}>
            ✉️ Email {notifyEmail?'✓':''}
          </button>
        </div>
        {errors.notify && <p style={{color:'#e74c3c',fontSize:11,marginBottom:12}}>⚠ {errors.notify}</p>}

        <div style={{background:'#0f0f1a',borderRadius:8,padding:10,marginBottom:16,border:'1px solid #2a2a4a'}}>
          <p style={{color:'#666',fontSize:12,margin:0}}>
            When you press SOS, <strong style={{color:'#fff'}}>{name||'this contact'}</strong> will receive
            {notifySms&&notifyEmail?' an SMS and email':notifySms?' an SMS':notifyEmail?' an email':' nothing yet'}
            {' '}with your live Google Maps location link.
          </p>
        </div>

        <button className="btn btn-primary" style={{width:'100%',padding:13,fontSize:15}} onClick={add}>
          + Add Trusted Contact
        </button>
      </div>
    </div>
  );
}
