import React, { useState } from 'react';
import { authAPI } from '../services/api';

const COUNTRY_CODES = [
  { code: '+91', name: 'India', flag: '🇮🇳', digits: 10, pattern: /^[6-9]\d{9}$/ },
  { code: '+1', name: 'USA/Canada', flag: '🇺🇸', digits: 10, pattern: /^\d{10}$/ },
  { code: '+44', name: 'UK', flag: '🇬🇧', digits: 10, pattern: /^\d{10}$/ },
  { code: '+61', name: 'Australia', flag: '🇦🇺', digits: 9, pattern: /^\d{9}$/ },
  { code: '+971', name: 'UAE', flag: '🇦🇪', digits: 9, pattern: /^\d{9}$/ },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', digits: 8, pattern: /^\d{8}$/ },
  { code: '+49', name: 'Germany', flag: '🇩🇪', digits: 10, pattern: /^\d{10}$/ },
  { code: '+33', name: 'France', flag: '🇫🇷', digits: 9, pattern: /^\d{9}$/ },
  { code: '+81', name: 'Japan', flag: '🇯🇵', digits: 10, pattern: /^\d{10}$/ },
  { code: '+86', name: 'China', flag: '🇨🇳', digits: 11, pattern: /^\d{11}$/ },
];

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (pw) => pw.length >= 6;

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode);

  const validate = () => {
    const e = {};
    if (!validateEmail(email)) e.email = 'Enter a valid email address';
    if (!validatePassword(password)) e.password = 'Password must be at least 6 characters';
    if (mode === 'register') {
      if (!name.trim() || name.trim().length < 2) e.name = 'Enter your full name';
      if (!selectedCountry.pattern.test(phone.replace(/\s/g, '')))
        e.phone = `Enter valid ${selectedCountry.digits}-digit number for ${selectedCountry.name}`;
    }
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true); setApiError('');
    try {
      const res = mode === 'login'
        ? await authAPI.login({ email, password })
        : await authAPI.register({ name, email, phone: countryCode + phone, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin();
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Something went wrong.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f0f0f' }}>
      <div style={{ width:'100%', maxWidth:420, padding:24 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:48 }}>🛡️</div>
          <h1 style={{ color:'#e74c3c', fontSize:28, fontWeight:900 }}>SafeGuard</h1>
          <p style={{ color:'#666', fontSize:13, marginTop:4 }}>Women Safety Heatmap & SOS Network</p>
        </div>
        <div className="card">
          <div style={{ display:'flex', marginBottom:20, gap:8 }}>
            <button className={`btn ${mode==='login'?'btn-primary':'btn-gray'}`} style={{flex:1}} onClick={()=>{setMode('login');setErrors({});setApiError('');}}>Login</button>
            <button className={`btn ${mode==='register'?'btn-primary':'btn-gray'}`} style={{flex:1}} onClick={()=>{setMode('register');setErrors({});setApiError('');}}>Register</button>
          </div>
          {apiError && <div className="alert-box alert-error">{apiError}</div>}
          {mode==='register' && (
            <>
              <input placeholder="Full name *" value={name}
                onChange={e=>{setName(e.target.value);setErrors(p=>({...p,name:''}));}}
                style={{borderColor:errors.name?'#e74c3c':'',marginBottom:errors.name?2:10}}/>
              {errors.name && <p style={{color:'#e74c3c',fontSize:11,marginBottom:8}}>⚠ {errors.name}</p>}
            </>
          )}
          <input placeholder="Email address *" type="email" value={email}
            onChange={e=>{setEmail(e.target.value);setErrors(p=>({...p,email:''}));}}
            style={{borderColor:errors.email?'#e74c3c':'',marginBottom:errors.email?2:10}}/>
          {errors.email && <p style={{color:'#e74c3c',fontSize:11,marginBottom:8}}>⚠ {errors.email}</p>}
          {mode==='register' && (
            <>
              <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Country & Phone *</label>
              <div style={{display:'flex',gap:8,marginBottom:errors.phone?2:10}}>
                <select value={countryCode} onChange={e=>{setCountryCode(e.target.value);setErrors(p=>({...p,phone:''}));}}
                  style={{width:180,padding:'10px 8px',background:'#0f0f1a',border:'1px solid #333',borderRadius:8,color:'#fff',fontSize:12}}>
                  {COUNTRY_CODES.map(c=>(
                    <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                  ))}
                </select>
                <input placeholder={`${selectedCountry.digits} digits`} value={phone}
                  onChange={e=>{setPhone(e.target.value.replace(/\D/g,''));setErrors(p=>({...p,phone:''}));}}
                  maxLength={selectedCountry.digits}
                  style={{flex:1,borderColor:errors.phone?'#e74c3c':'',marginBottom:0}}/>
              </div>
              {errors.phone && <p style={{color:'#e74c3c',fontSize:11,marginBottom:8}}>⚠ {errors.phone}</p>}
            </>
          )}
          <input placeholder="Password * (min 6 chars)" type="password" value={password}
            onChange={e=>{setPassword(e.target.value);setErrors(p=>({...p,password:''}));}}
            onKeyDown={e=>e.key==='Enter'&&submit()}
            style={{borderColor:errors.password?'#e74c3c':'',marginBottom:errors.password?2:10}}/>
          {errors.password && <p style={{color:'#e74c3c',fontSize:11,marginBottom:8}}>⚠ {errors.password}</p>}
          <button className="btn btn-primary" style={{width:'100%',padding:12,fontSize:16,marginTop:4}}
            onClick={submit} disabled={loading}>
            {loading?'Please wait...':mode==='login'?'Login':'Create Account'}
          </button>
        </div>
        <p style={{color:'#444',fontSize:11,textAlign:'center',marginTop:16}}>
          UN SDG #3 — Good Health & Well-Being · Women Safety Initiative
        </p>
      </div>
    </div>
  );
}
