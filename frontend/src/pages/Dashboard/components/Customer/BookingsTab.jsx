import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiClipboard } from 'react-icons/bi';
import { AiOutlineCheckCircle } from 'react-icons/ai';
import { FiClock, FiXCircle, FiUser } from 'react-icons/fi';
import { verifyBookingByCustomer } from '../../../../services/api';

export default function BookingsTab({ bookings, setBookings, reviewsMap, onOpenProviderChat }) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');

  const normalizeDate = (dateValue) => {
    if (!dateValue) return null;
    const parsed = new Date(`${dateValue}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const sortAndFilterBookings = useMemo(() => {
    const filtered = (bookings || []).filter((booking) => {
      const status = booking.status?.toLowerCase() || '';
      const providerName = booking.provider?.name || '';
      const category = booking.service?.category || '';
      const subcategory = booking.service?.subcategory || '';
      const query = searchTerm.trim().toLowerCase();

      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesSearch = !query ||
        providerName.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query) ||
        subcategory.toLowerCase().includes(query);
      const matchesDate = !dateFilter || booking.bookingDate === dateFilter;

      return matchesStatus && matchesSearch && matchesDate;
    });

    return filtered.sort((left, right) => {
      const leftDate = normalizeDate(left.bookingDate)?.getTime() || 0;
      const rightDate = normalizeDate(right.bookingDate)?.getTime() || 0;

      if (sortOrder === 'oldest') {
        return leftDate - rightDate;
      }
      return rightDate - leftDate;
    });
  }, [bookings, statusFilter, searchTerm, dateFilter, sortOrder]);

  const handleCustomerVerify = async (bookingId) => {
    try {
      await verifyBookingByCustomer(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'completed' } : b)));
      alert('Booking marked as completed!');
    } catch (err) {
      console.error('Failed to verify booking:', err);
      alert('Failed to verify booking.');
    }
  };

  const handleLeaveReview = (booking) => {
    navigate(`/provider/${booking.provider.id}`, {
      state: { bookingId: booking.id, serviceId: booking.service.id },
    });
  };

  const getStatusBadge = (b) => {
    if (b.providerMarkedComplete && b.status?.toLowerCase() === 'confirmed') {
      return (
        <span className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-semibold">
          Waiting for verification
        </span>
      );
    }

    switch (b.status?.toLowerCase()) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-semibold">
            <AiOutlineCheckCircle /> {b.status}
          </span>
        );
      case 'confirmed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-semibold">
            <FiClock /> {b.status}
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full font-semibold">
            <FiClock /> {b.status}
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full font-semibold">
            <FiXCircle /> {b.status}
          </span>
        );
      default:
        return <span className="px-2 py-1 bg-gray-100 rounded-full">{b.status}</span>;
    }
  };

  if (!bookings || bookings.length === 0) {
    return <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No bookings available.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
        <BiClipboard /> My Bookings
        </h2>
        <p className="mt-1 text-sm text-slate-500">Track status, verify completed work, and review providers.</p>
      </div>

      <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search provider or service"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#1d4ed8] focus:outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#1d4ed8] focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#1d4ed8] focus:outline-none"
          />

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#1d4ed8] focus:outline-none"
          >
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        <div className="mt-3 text-xs font-medium text-slate-500">
          Showing {sortAndFilterBookings.length} of {bookings.length} bookings
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {sortAndFilterBookings.map((b) => (
          <div
            key={b.id}
            className="rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]"
            style={{
              borderColor:
                b.status?.toLowerCase() === 'pending'
                  ? '#facc15'
                  : b.status?.toLowerCase() === 'completed'
                  ? '#16a34a'
                  : b.status?.toLowerCase() === 'confirmed'
                  ? '#3b82f6'
                  : '#dc2626',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{b.provider?.name || 'Unknown provider'}</h3>
                <p className="mt-1 text-sm text-slate-500">{b.service?.category} - {b.service?.subcategory}</p>
              </div>
              {getStatusBadge(b)}
            </div>

            <p className="text-sm text-slate-600">{b.service?.description}</p>
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Date:</span> {b.bookingDate} | <span className="font-semibold">Time:</span> {b.timeSlot}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
            {b.providerMarkedComplete && b.status?.toLowerCase() === 'confirmed' && (
              <button onClick={() => handleCustomerVerify(b.id)} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                Verify & Complete
              </button>
            )}
            {b.status?.toLowerCase() !== 'cancelled' && (
              <button
                onClick={() => {
                  if (onOpenProviderChat && b.provider?.id) {
                    onOpenProviderChat({ id: b.provider.id, name: b.provider?.name || 'Provider', category: b.service?.category || 'Service Provider' });
                  } else {
                    navigate(`/chat/${b.provider.id}`, { state: { provider: b.provider } });
                  }
                }}
                className="rounded-2xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1740b8]"
              >
                Chat
              </button>
            )}

            {b.status?.toLowerCase() === 'completed' && !reviewsMap[b.id] && (
              <button onClick={() => handleLeaveReview(b)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Leave a Review
              </button>
            )}
            </div>
          </div>
        ))}
      </div>

      {sortAndFilterBookings.length === 0 && (
        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No bookings match your current filters.
        </div>
      )}
    </div>
  );
}
