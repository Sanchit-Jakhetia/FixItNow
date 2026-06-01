import React, { useMemo, useState } from 'react';
import { createBooking } from '../../../../services/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function expandDayRange(startDay, endDay) {
  const startIndex = DAYS.indexOf(startDay);
  const endIndex = DAYS.indexOf(endDay);
  if (startIndex === -1 || endIndex === -1) return [];
  if (startIndex <= endIndex) return DAYS.slice(startIndex, endIndex + 1);
  return [...DAYS.slice(startIndex), ...DAYS.slice(0, endIndex + 1)];
}

function normalizeDayToken(token) {
  const clean = token.trim().toLowerCase();
  if (!clean) return null;

  const map = {
    sun: 'Sun', sunday: 'Sun',
    mon: 'Mon', monday: 'Mon',
    tue: 'Tue', tues: 'Tue', tuesday: 'Tue',
    wed: 'Wed', wednesday: 'Wed',
    thu: 'Thu', thur: 'Thu', thurs: 'Thu', thursday: 'Thu',
    fri: 'Fri', friday: 'Fri',
    sat: 'Sat', saturday: 'Sat',
  };

  return map[clean] || null;
}

function parseDays(daysText = '') {
  const value = daysText.trim();
  if (!value) return DEFAULT_DAYS;
  if (/everyday/i.test(value)) return [...DAYS];

  const parts = value
    .replace(/\s+/g, '')
    .split(',')
    .filter(Boolean);

  const result = [];

  parts.forEach((part) => {
    if (part.includes('-')) {
      const [left, right] = part.split('-');
      const startDay = normalizeDayToken(left);
      const endDay = normalizeDayToken(right);
      const expanded = startDay && endDay ? expandDayRange(startDay, endDay) : [];
      expanded.forEach((day) => {
        if (!result.includes(day)) result.push(day);
      });
      return;
    }

    const day = normalizeDayToken(part);
    if (day && !result.includes(day)) result.push(day);
  });

  return result.length ? result : DEFAULT_DAYS;
}

function parseTimeToMinutes(raw = '') {
  const input = raw.trim().toLowerCase().replace('.', ':');
  if (!input) return null;

  const match = input.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || '0');
  const period = match[3];

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) return null;

  if (period) {
    if (hours < 1 || hours > 12) return null;
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}

function toDisplayTime(totalMinutes) {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function parseAvailability(availability = '') {
  const text = String(availability || '').trim();
  if (!text) {
    return {
      days: DEFAULT_DAYS,
      slots: ['9:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM'],
    };
  }

  let dayPart = text;
  let timePart = '';

  if (text.includes('|')) {
    const [left, right] = text.split('|');
    dayPart = (left || '').trim();
    timePart = (right || '').trim();
  } else {
    const timeStartIndex = text.search(/\d{1,2}(?::|\.)?\d{0,2}\s*(?:am|pm)?/i);
    if (timeStartIndex > 0) {
      dayPart = text.slice(0, timeStartIndex).replace(/[,-]\s*$/, '').trim();
      timePart = text.slice(timeStartIndex).trim();
    }
  }

  const days = parseDays(dayPart);
  const rangeMatch = timePart.replace(/\./g, ':').match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);

  const start = parseTimeToMinutes(rangeMatch?.[1] || '9:00 am');
  const end = parseTimeToMinutes(rangeMatch?.[2] || '5:00 pm');

  let slotStart = start ?? 9 * 60;
  let slotEnd = end ?? 17 * 60;
  if (slotEnd <= slotStart) slotEnd = slotStart + 60;

  const slots = [];
  for (let t = slotStart; t + 60 <= slotEnd; t += 60) {
    slots.push(`${toDisplayTime(t)} - ${toDisplayTime(t + 60)}`);
  }

  return {
    days,
    slots: slots.length ? slots : ['9:00 AM - 10:00 AM'],
  };
}

export default function BookingFormModal({ service, customer, onClose }) {
  const [formData, setFormData] = useState({ bookingDate: '', timeSlot: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { days: availableDays, slots: availableSlots } = useMemo(
    () => parseAvailability(service?.availability),
    [service?.availability]
  );
  const minDate = new Date().toISOString().split('T')[0];

  const isDateAllowed = (dateText) => {
    if (!dateText) return false;
    const date = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    return availableDays.includes(DAYS[date.getDay()]);
  };

  const handleDateChange = (value) => {
    if (value && !isDateAllowed(value)) {
      const dayName = DAYS[new Date(`${value}T00:00:00`).getDay()];
      setMessage(`Provider is not available on ${dayName}.`);
      setFormData((current) => ({ ...current, bookingDate: '', timeSlot: '' }));
      return;
    }

    setMessage('');
    setFormData((current) => ({ ...current, bookingDate: value, timeSlot: '' }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!formData.bookingDate || !formData.timeSlot) {
      setMessage('Please select both date and time slot.');
      setLoading(false);
      return;
    }

    try {
      const bookingData = {
        customer: { id: customer.id },
        provider: { id: service.providerId || service.id },
        service: { id: service.id },
        bookingDate: formData.bookingDate,
        timeSlot: formData.timeSlot,
        notes: formData.notes,
        status: 'PENDING',
      };

      const res = await createBooking(bookingData);
      console.log('Booking successful:', res.data);
      setMessage('Booking successful!');
      alert('Booking confirmed!');
      onClose();
    } catch (err) {
      console.error('Booking failed:', err.response?.data || err.message);
      setMessage('Booking failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">✖</button>

        <h2 className="text-xl font-semibold mb-4 text-center text-blue-700">Book Service: {service.subcategory}</h2>

        <div className="space-y-4">
          <p className="text-gray-700 text-sm"><strong>Provider:</strong> {service.providerName || 'Unknown'}</p>
          <p className="text-gray-700 text-sm"><strong>Price:</strong> ₹{service.price}</p>
          <p className="text-gray-700 text-sm"><strong>Availability:</strong> {service.availability || 'Not specified'}</p>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Booking Date</label>
            <input
              type="date"
              min={minDate}
              value={formData.bookingDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="border w-full px-3 py-2 rounded"
            />
            <p className="mt-1 text-xs text-gray-500">Available days: {availableDays.join(', ')}</p>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Time Slot</label>
            <select
              value={formData.timeSlot}
              onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              className="border w-full px-3 py-2 rounded"
              disabled={!formData.bookingDate}
            >
              <option value="">Select a time</option>
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Notes (optional)</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="border w-full px-3 py-2 rounded" placeholder="Any special instructions?" />
          </div>

          <button onClick={handleBookingSubmit} disabled={loading} className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">{loading ? 'Booking...' : 'Confirm Booking'}</button>

          {message && <p className={`text-center mt-2 font-medium ${message.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </div>
      </div>
    </div>
  );
}
