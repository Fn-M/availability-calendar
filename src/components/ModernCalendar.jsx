import React, { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  addWeeks, 
  subWeeks,
  isSameDay,
  setHours,
  setMinutes,
  addMinutes,
  parseISO,
  isWeekend,
  differenceInMinutes,
  isSameMinute,
  startOfDay,
  addHours
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import BookingModal from './BookingModal';
import './ModernCalendar.css';

// Common timezone options
const TIMEZONE_OPTIONS = [
  { value: 'Europe/Lisbon', icon: '🇵🇹', label: 'Lisbon (WET/WEST)' },
  { value: 'Europe/Amsterdam', icon: '🇳🇱', label: 'Amsterdam (CET/CEST)' },
  { value: 'America/New_York', icon: '🇺🇸', label: 'New York (ET)' },
  { value: 'America/Toronto', icon: '🇨🇦', label: 'Toronto (ET)' },
  { value: 'America/Los_Angeles', icon: '🇺🇸', label: 'Los Angeles (PT)' },
];

const ModernCalendar = ({ events: initialEvents, isAdmin }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [events, setEvents] = useState(initialEvents);
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    return localStorage.getItem('selectedTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
  const apiKey = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    localStorage.setItem('selectedTimezone', selectedTimezone);
  }, [selectedTimezone]);

  // Generate fixed time slots (9 AM to 9 PM)
  const generateTimeSlots = () => {
    const slots = [];
    const baseDate = startOfDay(new Date()); // Use a fixed date for consistency
    
    for (let i = 0; i < 24; i++) {
      const time = addMinutes(addHours(baseDate, 9), i * 30); // Start at 9 AM
      const formattedTime = formatInTimeZone(time, selectedTimezone, 'HH:mm');
      slots.push(formattedTime);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Convert events to selected timezone
  const convertedEvents = events.map(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    return {
      ...event,
      start: parseISO(formatInTimeZone(eventStart, selectedTimezone, "yyyy-MM-dd'T'HH:mm:ss")),
      end: parseISO(formatInTimeZone(eventEnd, selectedTimezone, "yyyy-MM-dd'T'HH:mm:ss")),
      originalTimezone: event.timezone
    };
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(startOfWeek(currentDate), i);
    return day;
  });

  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());
  const goToPreviousDay = () => setCurrentDate(addDays(currentDate, -1));
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1));

  const getEventForSlot = (day, timeSlot) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = setMinutes(setHours(day, hours), minutes);
    
    return convertedEvents.find(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return isSameDay(slotTime, eventStart) && 
             slotTime >= eventStart && 
             slotTime < eventEnd;
    });
  };

  const isFirstSlotOfEvent = (day, timeSlot, event) => {
    if (!event) return false;
    const eventStart = new Date(event.start);
    return format(eventStart, 'HH:mm') === timeSlot;
  };

  const handleCellClick = (day, timeSlot) => {
    if (!isAdmin) return;
    
    const event = getEventForSlot(day, timeSlot);
    if (event) {
      setActiveBooking(event);
    } else {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const startDate = setMinutes(setHours(day, hours), minutes);
      const endDate = addMinutes(startDate, 30);
      
      setActiveBooking({
        start: startDate,
        end: endDate,
        title: '',
        invitees: '',
        notes: '',
        timezone: selectedTimezone
      });
    }
    setShowModal(true);
  };

  // API Functions
  const handleAddEvent = async (newEvent) => {
    try {
      // Ensure all values are properly formatted
      const payload = {
        title: String(newEvent.title || ''),
        start: newEvent.start instanceof Date 
          ? newEvent.start
          : new Date(newEvent.start).toISOString(),
        end: newEvent.end instanceof Date 
          ? newEvent.end.toISOString() 
          : new Date(newEvent.end).toISOString(),
        invitees: String(newEvent.invitees || ''),
        notes: String(newEvent.notes || ''),
        timezone: String(newEvent.timezone || 'Europe/Amsterdam')
      };


      const response = await fetch(apiEndpoint + '/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(payload)
      });


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }

      const newEventWithId = {
        ...newEvent,
        id: data.id,
      };

      setEvents(prevEvents => [...prevEvents, newEventWithId]);
      handleCloseModal();

    } catch (err) {
      console.error('Create failed:', err);
      alert(`⚠️ Failed to create booking: ${err.message}`);
    }
  };

  const handleUpdateEvent = async (updatedEvent) => {
    try {

      // Ensure all values are properly formatted
      const payload = {
        id: String(updatedEvent.id),
        title: String(updatedEvent.title || ''),
        start: updatedEvent.start instanceof Date 
          ? updatedEvent.start.toISOString() 
          : new Date(updatedEvent.start).toISOString(),
        end: updatedEvent.end instanceof Date 
          ? updatedEvent.end.toISOString() 
          : new Date(updatedEvent.end).toISOString(),
        invitees: String(updatedEvent.invitees || ''),
        notes: String(updatedEvent.notes || ''),
        timezone: String(updatedEvent.timezone || 'Europe/Amsterdam')
      };


      const response = await fetch(apiEndpoint + '/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      // Log the response
      const responseText = await response.text();

      // Try to parse the response if it's JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', e);
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update booking');
      }

      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        )
      );
      handleCloseModal();

    } catch (err) {
      console.error('Update failed:', err);
      alert(`⚠️ Failed to update booking: ${err.message}`);
    }
  };

  const handleDeleteEvent = async () => {
    if (!activeBooking?.id) return;

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

      setEvents(prevEvents => prevEvents.filter(event => event.id !== activeBooking.id));
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

  return (
    <div className="modern-planner">
      <div className="planner-header">
        <div className="mobile-header-layout">
          <div className="navigation-buttons">
            <button 
              onClick={isMobile ? goToPreviousDay : goToPreviousWeek}
              className="nav-button"
            >
              Previous
            </button>
            <button 
              onClick={goToToday}
              className="nav-button"
            >
              Today
            </button>
            <button 
              onClick={isMobile ? goToNextDay : goToNextWeek}
              className="nav-button"
            >
              Next
            </button>
          </div>

          <div className="timezone-selector">
            <span className="timezone-label">Timezone:</span>
            <div className="timezone-buttons">
              {TIMEZONE_OPTIONS.map((tz) => (
                <button
                  key={tz.value}
                  onClick={() => setSelectedTimezone(tz.value)}
                  className={`timezone-button ${
                    selectedTimezone === tz.value ? 'active' : ''
                  }`}
                  title={tz.label}
                >
                  <span>{tz.icon}</span>
                  <span className="timezone-name">{tz.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <h2 className="current-date">
            {format(currentDate, 'EEEE, MMMM d')}
          </h2>
        </div>
      </div>

      <div className="planner-grid">
        <div className="time-column">
          <div className="day-header"></div>
          {timeSlots.map((time, index) => (
            <div key={index} className="time-slot">
              {time}
            </div>
          ))}
        </div>

        <div className="day-columns-container">
          {(isMobile ? [currentDate] : weekDays).map((day, dayIndex, arr) => (
            <div 
              key={dayIndex} 
              className={`day-column${isWeekend(day) ? ' weekend' : ''}${dayIndex !== arr.length - 1 ? ' not-last' : ''}`}
            >
              <div className={`day-header${isWeekend(day) ? ' weekend' : ''}`}>
                <div className="day-name">{format(day, 'EEE')}</div>
                <div className="day-date">{format(day, 'd/MM')}</div>
              </div>
              <div className="time-slots-container">
                {timeSlots.map((timeSlot, timeIndex) => {
                  const event = getEventForSlot(day, timeSlot);
                  const isFirst = isFirstSlotOfEvent(day, timeSlot, event);
                  const isWeekendDay = isWeekend(day);
                  return (
                    <div
                      key={timeIndex}
                      className={`time-slot-cell${event ? ' booked' : ' available'}${isWeekendDay ? ' weekend' : ''}`}
                      onClick={() => isAdmin && handleCellClick(day, timeSlot)}
                    >
                      {event && isFirst && (
                        <div 
                          className="booking-block"
                          style={{
                            height: `${differenceInMinutes(new Date(event.end), new Date(event.start)) / 30 * 100}%`
                          }}
                        >
                          {isAdmin ? (
                            <div className="booking-content">
                              <div className="booking-title-container">
                                <span className="booking-title" title={event.title}>
                                  {event.title}
                                </span>
                                {event.originalTimezone !== selectedTimezone && (
                                  <span 
                                    className="booking-timezone" 
                                    title={`Originally scheduled in ${event.originalTimezone}`}
                                  >
                                    {TIMEZONE_OPTIONS.find(tz => tz.value === event.originalTimezone)?.icon || '🌐'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="unavailable-text">Unavailable</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <BookingModal
          onClose={handleCloseModal}
          onSubmit={handleAddEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          existingEvents={events}
          booking={activeBooking}
          selectedTimezone={selectedTimezone}
        />
      )}
    </div>
  );
};

export default ModernCalendar; 