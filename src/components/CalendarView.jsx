import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';
import BookingModal from './BookingModal';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CalendarView = ({ events: initialEvents, isAdmin }) => {
  const [events, setEvents] = useState(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
  const apiKey = import.meta.env.VITE_API_KEY;

  const handleNavigate = (newDate) => setCurrentDate(newDate);

  const handleAddEvent = async (newEvent) => {
    try {
      const response = await fetch(apiEndpoint + '/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          title: newEvent.title,
          start: newEvent.start.toISOString(),
          end: newEvent.end.toISOString(),
          invitees: newEvent.invitees,
          notes: newEvent.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.id) {
        throw new Error('Failed to create booking');
      }

      const newEventWithId = {
        ...newEvent,
        id: data.id,
      };

      setEvents((prevEvents) => [...prevEvents, newEventWithId]);
      handleCloseModal();

    } catch (err) {
      console.error('Create failed:', err);
      alert('⚠️ Failed to create booking. Please try again.');
    }
  };


  const handleUpdateEvent = async (updatedEvent) => {
    try {
      const response = await fetch(apiEndpoint + '/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          id: updatedEvent.id,
          title: updatedEvent.title,
          start: updatedEvent.start.toISOString(),
          end: updatedEvent.end.toISOString(),
          invitees: updatedEvent.invitees,
          notes: updatedEvent.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking');
      }

      setEvents(events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
      handleCloseModal();

    } catch (err) {
      console.error('Update failed:', err);
      alert('⚠️ Failed to update booking. Please try again.');
    }
  };


  const handleDeleteEvent = async () => {
    try {
      const response = await fetch(apiEndpoint + '/bookings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ id: activeBooking.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }

      setEvents(events.filter((e) => e.id !== activeBooking.id));
      handleCloseModal();

    } catch (err) {
      console.error('Delete failed:', err);
      alert('⚠️ Failed to delete booking. Please try again.');
    }
  };


  const handleCloseModal = () => {
    setShowModal(false);
    setActiveBooking(null);
  };

  const handleSelectSlot = ({ start }) => {
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    setActiveBooking({ start, end });
    setShowModal(true);
  };

  const handleSelectEvent = (event) => {
    setActiveBooking(event);
    setShowModal(true);
  };

  const eventPropGetter = (event) => ({
    style: {
      backgroundColor: isAdmin ? '#87ceeb' : '#d3d3d3',
      color: isAdmin ? 'black' : 'transparent',
      borderRadius: '4px',
      padding: '4px',
      cursor: isAdmin ? 'pointer' : 'default',
    },
  });

  const CustomEvent = ({ event }) => <span>{event.title}</span>;

  return (
    <div className={isAdmin ? 'admin-calendar' : 'public-calendar'}>
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '10px' }}>
          <button
            onClick={() => {
              setActiveBooking(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Book Timeslot
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 shadow">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          step={30}
          timeslots={2}
          defaultView="week"
          views={{ week: true }}
          date={currentDate}
          onNavigate={handleNavigate}
          min={new Date(1970, 1, 1, 9, 0)}
          max={new Date(1970, 1, 1, 21, 0)}
          showAllDaySlot={false}
          eventPropGetter={eventPropGetter}
          components={{ event: CustomEvent }}
          style={{ height: '80vh', margin: '20px' }}
          selectable={isAdmin}
          onSelectSlot={isAdmin ? handleSelectSlot : null}
          onSelectEvent={isAdmin ? handleSelectEvent : null}
        />
      </div>

      {isAdmin && showModal && (
        <BookingModal
          onClose={handleCloseModal}
          onSubmit={handleAddEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          existingEvents={events}
          booking={activeBooking}
        />
      )}
    </div>
  );
};

export default CalendarView;