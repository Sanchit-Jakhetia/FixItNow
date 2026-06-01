import React from 'react';
import { motion } from 'framer-motion';
import { AiOutlineCheckCircle } from 'react-icons/ai';
import { FiClock, FiXCircle } from 'react-icons/fi';
import { BiClipboard } from 'react-icons/bi';

const PRIMARY_COLOR = "#4F46E5";
const SUCCESS_COLOR = "#10B981";
const WARNING_COLOR = "#F59E0B";
const DANGER_COLOR = "#EF4444";

export default function BookingsCard({ bookings, loading }) {
  if (loading)
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading bookings...</p>
        </div>
      </div>
    );

  const getStatusBadge = (status) => {
    if (!status) return null;
    const bgColor = {
      completed: { bg: '#10B98120', text: '#059669', icon: AiOutlineCheckCircle, label: '✓' },
      pending: { bg: '#F59E0B20', text: '#D97706', icon: FiClock, label: '⏱' },
      cancelled: { bg: '#EF444420', text: '#DC2626', icon: FiXCircle, label: '✕' },
      confirmed: { bg: '#3B82F620', text: '#1D4ED8', icon: FiClock, label: '✓' },
    }[status.toLowerCase()] || { bg: '#00000010', text: '#000000', label: status };

    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{ backgroundColor: bgColor.bg, color: bgColor.text }}
      >
        {bgColor.label} {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-indigo-100">
          <BiClipboard className="text-2xl" style={{ color: PRIMARY_COLOR }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Recent Bookings</h2>
          <p className="text-sm text-slate-600">Latest service requests</p>
        </div>
      </div>

      <div className="space-y-3">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
            <BiClipboard className="text-4xl text-slate-300 mb-2" />
            <p className="text-slate-600 font-medium">No bookings yet</p>
          </div>
        ) : (
          bookings.map((b, idx) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              whileHover={{ x: 4 }}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-gradient-to-r from-slate-50 to-indigo-50 transition-all duration-300 group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate group-hover:text-indigo-700">
                  {b.customer?.name || 'Unknown Customer'}
                </p>
                <p className="text-sm text-slate-500 truncate">
                  {b.service?.category} {b.service?.subcategory && `• ${b.service.subcategory}`}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <div className="text-right">
                  <p className="font-bold text-lg text-slate-900">
                    ₹{b.service?.price || 0}
                  </p>
                  <p className="text-xs text-slate-500">
                    {b.bookingDate
                      ? new Date(b.bookingDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div className="ml-2">{getStatusBadge(b.status)}</div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

