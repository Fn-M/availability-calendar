import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';
import BookingModal from './BookingModal';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});



const CalendarView = ({ events: initialEvents, isAdmin }) => {
  const [events, setEvents] = useState(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
  }, [events, initialEvents]);  // This hook logs both when events or initialEvents change


  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleAddEvent = (newEvent) => {
    setEvents((prevEvents) => [...prevEvents, newEvent]);
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

  const CustomEvent = ({ event }) => {
    return <span>{event.title}</span>;
  };
  
  const handleSelectSlot = ({ start }) => {
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    setSelectedSlot({ start, end });
    setShowModal(true);
  };
  

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSlot(null);
  };
  

  return (
    <div className={isAdmin ? 'admin-calendar' : 'public-calendar'}>
      
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '10px' }}>
          <button onClick={() => setShowModal(true)} className="book-btn">
            Book Timeslot
          </button>
        </div>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        step={30}
        timeslots={2}
        defaultView="work_week"
        views={{ work_week: true }}
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
      />

      {isAdmin && showModal && selectedSlot &&(
        <BookingModal
          onClose={handleCloseModal}
          onSubmit={handleAddEvent}
          existingEvents={events}
          initialStart={selectedSlot?.start}
          initialEnd={selectedSlot?.end} 
        />
      )}
      </div>
  );
};

export default CalendarView;
