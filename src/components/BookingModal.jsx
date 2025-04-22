import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import './BookingModal.css';

// Simplified timezone options with just icons and values
const TIMEZONE_OPTIONS = [
  { value: 'Europe/Lisbon', icon: '🇵🇹', label: 'Lisbon' },
  { value: 'Europe/Amsterdam', icon: '🇳🇱', label: 'Amsterdam' },
  { value: 'America/New_York', icon: '🇺🇸', label: 'New York' },
  { value: 'America/Toronto', icon: '🇨🇦', label: 'Toronto' },
  { value: 'America/Los_Angeles', icon: '🇺🇸', label: 'Los Angeles' },
];

const BookingModal = ({ onClose, onSubmit, onUpdate, onDelete, existingEvents, booking, selectedTimezone }) => {
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    invitees: '',
    notes: '',
    timezone: TIMEZONE_OPTIONS[0],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (booking) {
      // Convert times to the selected timezone
      const startDate = new Date(booking.start);
      const endDate = new Date(booking.end);

      setFormData({
        title: booking.title || '',
        start: formatInTimeZone(startDate, selectedTimezone, "yyyy-MM-dd'T'HH:mm"),
        end: formatInTimeZone(endDate, selectedTimezone, "yyyy-MM-dd'T'HH:mm"),
        invitees: booking.invitees || '',
        notes: booking.notes || '',
        timezone: TIMEZONE_OPTIONS.find(tz => tz.value === (booking.timezone || selectedTimezone)) || TIMEZONE_OPTIONS[0],
      });
    }
  }, [booking, selectedTimezone]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const { start, end, title, invitees, notes, timezone } = formData;

    // Convert the local times to UTC using the selected timezone
    const startInSelectedTz = formatInTimeZone(
      new Date(start), 
      timezone.value, 
      'yyyy-MM-dd\'T\'HH:mm:ssXXX'
    );
    const endInSelectedTz = formatInTimeZone(
      new Date(end), 
      timezone.value, 
      'yyyy-MM-dd\'T\'HH:mm:ssXXX'
    );

    const newBooking = {
      id: booking?.id,
      title: String(title.trim()),
      start: new Date(startInSelectedTz),
      end: new Date(endInSelectedTz),
      invitees: String(invitees?.trim() || ''),
      notes: String(notes?.trim() || ''),
      timezone: timezone.value
    };

    if (booking?.id) {
      onUpdate(newBooking);
    } else {
      onSubmit(newBooking);
    }

    setError('');
    onClose();
  };

  const hasClash = (start, end, timezone) => {
    const newStart = new Date(start);
    const newEnd = new Date(end);

    return existingEvents.some((event) => {
      if (booking?.id && event.id === booking.id) return false;
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return newStart < eventEnd && newEnd > eventStart;
    });
  };

  function downloadICS(event) {
    const pad = (n) => String(n).padStart(2, '0');

    // Get the event's original timezone
    const eventTimezone = event.timezone;

    // Format date for ICS with timezone
    const formatDateForICS = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    };

    const start = new Date(event.start);
    const end = new Date(event.end);

    // Format description with invitees and notes
    const notes = (event.notes || '').replace(/\n/g, '\\n');
    const invitees = (event.invitees || '').replace(/\n/g, '\\n');
    const description = `Invitees: ${invitees}\\nNotes: ${notes}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YourApp//Availability Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VTIMEZONE',
      `TZID:${eventTimezone}`,
      'BEGIN:STANDARD',
      'DTSTART:19701101T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'TZNAME:CET',
      'END:STANDARD',
      'BEGIN:DAYLIGHT',
      'DTSTART:19700329T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'TZNAME:CEST',
      'END:DAYLIGHT',
      'END:VTIMEZONE',
      'BEGIN:VEVENT',
      `UID:${event.id || Date.now()}@yourapp.com`,
      `DTSTAMP:${formatDateForICS(new Date())}`,
      `DTSTART;TZID=${eventTimezone}:${formatDateForICS(start)}`,
      `DTEND;TZID=${eventTimezone}:${formatDateForICS(end)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${description}`,
      'SEQUENCE:0',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { 
      type: 'text/calendar;charset=utf-8;method=PUBLISH'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">
            {booking?.id ? 'Edit Booking' : 'New Booking'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Time and Timezone Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date & Time</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="datetime-local"
                  name="start"
                  value={formData.start}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="datetime-local"
                  name="end"
                  value={formData.end}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <div className="flex gap-2">
                {TIMEZONE_OPTIONS.map((tz) => (
                  <button
                    key={tz.value}
                    onClick={() => setFormData({ ...formData, timezone: tz })}
                    className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                      formData.timezone.value === tz.value
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'border-2 border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{tz.icon}</span>
                    <span className="text-xs text-gray-600 mt-1">{tz.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Invitees and Notes Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invitees</label>
              <input
                type="text"
                name="invitees"
                value={formData.invitees}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email addresses"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-xl">
          {booking?.id ? (
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => downloadICS(booking)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Download ICS file"
              >
                <span className="text-xl">📅</span>
                <span className="hidden sm:inline">Download Calendar</span>
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Update
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
