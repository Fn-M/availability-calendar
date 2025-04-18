import React, { useEffect, useState } from 'react';
import CalendarView from '../components/CalendarView';

const PublicPage = () => {
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

  if (loading) {
    return <div>Loading...</div>; 
  }

  return (
    <div className="page-container">
      <h1>Available Time Slots – Fábio</h1>
      <CalendarView events={events} isAdmin={false} />
    </div>
  );
};

export default PublicPage;
