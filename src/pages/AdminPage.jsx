import React, { useState, useEffect } from 'react';
import ModernCalendar from '../components/ModernCalendar';

const AdminPage = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
  const apiKey = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    fetch(apiEndpoint + '/bookings')
      .then(res => res.json())
      .then(data => {
        const parsedEvents = data.map(e => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        }));
        setEvents(parsedEvents);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load events:", err);
        setLoading(false);
      });
  }, []);

  const handleLogin = async () => {
    setError('');
    
    try {
      const response = await fetch(apiEndpoint + '/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': apiKey
         },
        body: JSON.stringify({
          password: inputPassword
        }),
      });
  
      const data = await response.json();
  
      if (response.status === 200 && data.success) {
        setAuthenticated(true);
        setError('');
      } else if (response.status === 401) {
        setError('Incorrect password.');
      } else if (response.status === 403) {
        setError('Too many attempts. Try again in 1 minute.');
      } else {
        setError('Unexpected error.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    }
  };
  


  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-6 text-center text-blue-400">Admin Access</h2>
          <input
            type="password"
            placeholder="Enter magic word"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            className="w-full p-3 text-sm bg-gray-700 border border-gray-600 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
          >
            Submit
          </button>
          {error && <p className="text-red-400 mt-4 text-sm text-center">{error}</p>}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
        Admin: Fábio’s Calendar
      </h1>
      <div className="max-w-7xl mx-auto bg-white p-6 shadow-lg rounded-lg">
        <ModernCalendar isAdmin={true} events={events} />
      </div>
    </div>
  );
};

export default AdminPage;
