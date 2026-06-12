import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SOSPage from './pages/SOSPage';
import ReportPage from './pages/ReportPage';
import ContactsPage from './pages/ContactsPage';
import LoginPage from './pages/LoginPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  const [page, setPage] = useState('map');
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;

  const pages = {
    map: <Home />,
    sos: <SOSPage />,
    report: <ReportPage />,
    contacts: <ContactsPage />,
    about: <AboutPage />
  };

  return (
    <div>
      <Navbar page={page} setPage={setPage} />
      {pages[page]}
    </div>
  );
}
