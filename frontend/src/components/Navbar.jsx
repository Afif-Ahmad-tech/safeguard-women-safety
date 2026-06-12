import React from 'react';
import '../styles/main.css';

export default function Navbar({ page, setPage }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const links = [
    { id:'map', label:'🗺️ Map' },
    { id:'sos', label:'🚨 SOS' },
    { id:'report', label:'📍 Report' },
    { id:'contacts', label:'👥 Contacts' },
    { id:'about', label:'ℹ️ About' },
  ];

  return (
    <nav className="navbar">
      <h1 style={{fontSize:18}}>🛡️ SafeGuard</h1>
      <div className="navbar-links" style={{gap:4}}>
        {links.map(l => (
          <button key={l.id}
            className={page === l.id ? 'active' : ''}
            onClick={() => setPage(l.id)}
            style={{fontSize:12,padding:'5px 10px'}}>
            {l.label}
          </button>
        ))}
        {user && (
          <button onClick={logout}
            style={{fontSize:11,padding:'5px 10px',background:'transparent',border:'1px solid #333',color:'#666',borderRadius:20,cursor:'pointer'}}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
