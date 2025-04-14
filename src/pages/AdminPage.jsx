import React, { useState, useEffect } from 'react';
import CalendarView from '../components/CalendarView';

const AdminPage = () => {
  const [authenticated, setAuthenticated] = useState(true);
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/events.json')
      .then((res) => res.json())
      .then((data) => {
        const parsedEvents = data.map((e) => ({
          ...e,
          title: e.title,
          start: new Date(e.start),
          end: new Date(e.end),
          invitees: e.invitees,
          notes: e.notes,
        }));
        setEvents(parsedEvents);
        setLoading(false);
      });
  }, []);

  const MAGIC_WORD = 'open-sesame'; // Move this to an .env variable

  const handleLogin = () => {
    if (inputPassword === MAGIC_WORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  if (!authenticated) {
    return (
      <div style={{ marginTop: '50px', textAlign: 'center' }}>
        <h2>Admin Access</h2>
        <input
          type="password"
          placeholder="Enter magic word"
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
          style={{ padding: '8px', fontSize: '16px' }}
        />
        <button onClick={handleLogin} style={{ marginLeft: '10px', padding: '8px 16px' }}>
          Submit
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>; 
  }

  return <CalendarView isAdmin={true} events={events} />;
};

export default AdminPage;
