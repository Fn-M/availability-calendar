import React, { useEffect, useState } from 'react';
import ModernCalendar from '../components/ModernCalendar';

const PublicPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;

  useEffect(() => {
    // If no API endpoint is configured, show demo data
    if (!apiEndpoint) {
      console.log('No API endpoint configured, showing demo data');
      setEvents([]);
      setLoading(false);
      return;
    }

    fetch(apiEndpoint+'/bookings')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
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
        setEvents([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">Loading availability...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white p-6">
      <main className="flex-grow">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-4">
          Fábio’s Availability
        </h1>
        <p className="text-center text-gray-500 mb-10">
          View available time slots below to schedule an appointment.
        </p>
        <div className="max-w-7xl mx-auto bg-white p-6 shadow-lg rounded-lg">
          <ModernCalendar events={events} isAdmin={false} />
        </div>
      </main>

      <footer className="mt-10 text-center text-sm text-gray-500">
        <p className="mb-2">© {new Date().getFullYear()} Fábio Miranda</p>
        <a
          href={import.meta.env.VITE_LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            className="w-5 h-5"
            viewBox="0 0 24 24"
          >
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 
        2.761 2.239 5 5 5h14c2.761 0 5-2.239 
        5-5v-14c0-2.761-2.239-5-5-5zm-11 
        19h-3v-10h3v10zm-1.5-11.268c-.966 
        0-1.75-.79-1.75-1.764s.784-1.764 
        1.75-1.764 1.75.79 
        1.75 1.764-.784 1.764-1.75 
        1.764zm13.5 11.268h-3v-5.604c0-1.337-.027-3.063-1.871-3.063-1.872 
        0-2.159 1.46-2.159 2.968v5.699h-3v-10h2.881v1.367h.041c.401-.761 
        1.379-1.561 2.838-1.561 3.033 0 3.593 1.996 
        3.593 4.59v5.604z" />
          </svg>
          LinkedIn
        </a>
      </footer>

    </div>
  );
};

export default PublicPage;
