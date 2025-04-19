import React, { useState, useEffect } from 'react';
import './BookingModal.css';

const BookingModal = ({ onClose, onSubmit, onUpdate, onDelete, existingEvents, booking }) => {
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    invitees: '',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (booking) {
      setFormData({
        title: booking.title || '',
        start: formatDateTimeLocal(booking.start),
        end: formatDateTimeLocal(booking.end),
        invitees: booking.invitees || '',
        notes: booking.notes || '',
      });
    }
  }, [booking]);

  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const hasClash = (start, end) => {
    const newStart = new Date(start);
    const newEnd = new Date(end);

    return existingEvents.some((event) => {
      if (booking?.id && event.id === booking.id) return false;
      return newStart < new Date(event.end) && newEnd > new Date(event.start);
    });
  };

  const handleSubmit = () => {
    const { start, end, title, invitees, notes } = formData;
    const newStart = new Date(start);
    const newEnd = new Date(end);

    if (hasClash(start, end)) {
      setError('⛔ Selected timeslot overlaps with an existing booking.');
      return;
    }

    const newBooking = {
      id: booking?.id, // include id if editing
      start: newStart,
      end: newEnd,
      title,
      invitees,
      notes,
    };

    if (booking?.id) {
      onUpdate(newBooking);
    } else {
      onSubmit(newBooking);
    }

    setError('');
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) onDelete();
  };

  const isEdit = !!booking?.id;

  function downloadICS(event) {
    const pad = (n) => String(n).padStart(2, '0');

    const start = new Date(event.start);
    const end = new Date(event.end);

    const formatDate = (d) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    const notes = (event.notes || '').replace(/\n/g, '\\n');
    const invitees = (event.invitees || '').replace(/\n/g, '\\n');
    const description = `Invitees: ${invitees}\\nNotes: ${notes || ''}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YourApp//Availability Calendar//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${event.id || Date.now()}@yourapp.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${event.location || ''}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title || 'booking'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  return (
    <div className="modal-overlay">
      <div className={`modal-content ${error ? 'shake' : ''}`}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{isEdit ? 'Edit Booking' : 'Book Timeslot'}</h2>
        {error && <div className="error">{error}</div>}

        <label>Title:</label>
        <input name="title" value={formData.title} onChange={handleChange} required />

        <label>Start Date & Time:</label>
        <input type="datetime-local" name="start" value={formData.start} onChange={handleChange} required />

        <label>End Date & Time:</label>
        <input type="datetime-local" name="end" value={formData.end} onChange={handleChange} required />

        <label>Invitees:</label>
        <input name="invitees" value={formData.invitees} onChange={handleChange} />

        <label>Notes:</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} />

        <div className="modal-actions">
          {isEdit ? (
            <div className="spaced-actions">
              <button className="download-ics-btn" onClick={() => downloadICS(booking)}>
                📅
              </button>
              <div className="right-buttons">
                <button className="update-btn" onClick={handleSubmit}>Update</button>
                <button className="delete-btn" onClick={handleDelete}>Delete</button>
              </div>
            </div>

          ) : (
            <button className="submit-btn" onClick={handleSubmit}>Submit</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
