import React, { useState, useEffect } from 'react';
import './BookingModal.css';

const BookingModal = ({
  onClose,
  onSubmit,
  existingEvents,
  initialStart,
  initialEnd,
}) => {
  const formatForDatetimeInput = (dateLike) => {
    const d = new Date(dateLike); // assumed to be in local time
    const pad = (n) => n.toString().padStart(2, '0');
  
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
  
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  };
  
  const toLocalDatetimeInputValue = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  
  
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    invitees: '',
    notes: '',
  });
  
  useEffect(() => {
    if (initialStart && initialEnd) {
      setFormData((prev) => ({
        ...prev,
        start: toLocalDatetimeInputValue(new Date(initialStart)),
        end: toLocalDatetimeInputValue(new Date(initialEnd)),
      }));
    }
  }, [initialStart, initialEnd]);
  

 const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    const newStart = new Date(formData.start);
    const newEnd = new Date(formData.end);

    const hasConflict = existingEvents.some(
      (event) =>
        newStart < new Date(event.end) && newEnd > new Date(event.start)
    );

    if (hasConflict) {
      setError('Selected timeslot overlaps with an existing booking.');
      return;
    }

    onSubmit({
      title: formData.title,
      start: newStart,
      end: newEnd,
      invitees: formData.invitees,
      notes: formData.notes,
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2>Book Timeslot</h2>
        {error && <p className="error">{error}</p>}

        <div>
          <label>Title:</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Start Date & Time:</label>
          <input
            type="datetime-local"
            name="start"
            value={formData.start}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>End Date & Time:</label>
          <input
            type="datetime-local"
            name="end"
            value={formData.end}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Invitees:</label>
          <input
            name="invitees"
            value={formData.invitees}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Notes:</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        <button onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
};

export default BookingModal;
