import React, { useState } from 'react';
import './BookingModal.css';

const BookingModal = ({ onClose, onSubmit, existingEvents, initialStart, initialEnd}) => {
  
  const [formData, setFormData] = useState({
    title: '',
    start: initialStart ? initialStart : '',
    end: initialEnd ? initialEnd : '',
    invitees: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const newStart = new Date(formData.start);
    const newEnd = new Date(formData.end);

    const clash = existingEvents.some((event) =>
      newStart < new Date(event.end) && newEnd > new Date(event.start)
    );

    if (clash) {
      setError('Selected timeslot overlaps with an existing booking.');
      return;
    }

    setError('');
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
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Book Timeslot</h2>
        {error && <p className="error">{error}</p>}
        <div>
          <label>Title:</label>
          <input name="title" onChange={handleChange} required />
        </div>
        <div>
          <label>Start Date & Time:</label>
          <input type="datetime-local" name="start" onChange={handleChange} required />
        </div>
        <div>
          <label>End Date & Time:</label>
          <input type="datetime-local" name="end" onChange={handleChange} required />
        </div>
        <div>
          <label>Invitees:</label>
          <input name="invitees" onChange={handleChange} />
        </div>
        <div>
          <label>Notes:</label>
          <textarea name="notes" onChange={handleChange} />
        </div>
        <button onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
};

export default BookingModal;
