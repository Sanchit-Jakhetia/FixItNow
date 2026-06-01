import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiSend } from 'react-icons/fi';
import { getReportsByUser, createReport, getProviders, getBookingsByCustomer, getBookingsByProvider, getAllBookings, getAllServices } from '../../../../services/api';

export default function ReportsTab({ user }) {
  const [reports, setReports] = useState([]);
  const [reason, setReason] = useState('');
  const [targetType, setTargetType] = useState('PROVIDER');
  const [targetId, setTargetId] = useState('');

  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (user?.id) fetchReports(user.id);
    fetchAllOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchReports = async (id) => {
    try {
      const res = await getReportsByUser(id);
      setReports(res.data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const fetchAllOptions = async () => {
    try {
      let provRes = { data: [] };
      let bookingRes = { data: [] };

      const serviceRes = await getAllServices();

      if (user.role !== 'PROVIDER') {
        provRes = await getProviders();
      }

      if (user.role === 'CUSTOMER') {
        bookingRes = await getBookingsByCustomer(user.id);
      } else if (user.role === 'PROVIDER') {
        bookingRes = await getBookingsByProvider(user.id);
      } else if (user.role === 'ADMIN') {
        bookingRes = await getAllBookings();
      }

      setProviders(provRes.data || []);
      setBookings(bookingRes.data || []);
      setServices(serviceRes.data || []);
    } catch (err) {
      console.error('Error fetching providers/bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return alert('User not loaded yet.');
    if (!targetId) return alert('Please select a valid target.');

    try {
      await createReport(user.id, targetType, targetId, reason);
      alert('✅ Report submitted successfully!');
      setReason('');
      setTargetId('');
      fetchReports(user.id);
    } catch (err) {
      console.error('Error creating report:', err);
      alert('❌ Failed to submit report.');
    }
  };

  const getTargetOptions = () => {
    if (loading) return [<option key="loading">Loading...</option>];

    switch (targetType) {
      case 'PROVIDER':
        return providers.length > 0
          ? providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name || p.fullName || p.email}</option>
            ))
          : [<option key="noprov">No providers found</option>];

      case 'BOOKING':
        return bookings.length > 0 ? (
          bookings.map((b) => {
            const serviceCategory = b.service?.category || 'Unnamed Category';
            const serviceSubcategory = b.service?.subcategory || 'Unnamed Subcategory';
            const providerName = b.provider?.name || b.provider?.fullName || b.service?.providerName || 'Unknown Provider';
            const date = b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : 'Unknown Date';
            const status = b.status || 'Pending';

            return (
              <option key={b.id} value={b.id} className="truncate">📅 {date} - {providerName} • {serviceCategory} ({serviceSubcategory}) - {status === 'COMPLETED' ? '✅' : '⏳'}</option>
            );
          })
        ) : (
          <option key="nobook">No bookings found</option>
        );

      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-rose-100 text-rose-600"><FiAlertTriangle size={20} /></span>
            Report an Issue
          </h2>
          <p className="text-sm text-slate-600 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">Logged in as: <strong>{user?.name || 'Loading...'}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Target Type</label>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1d4ed8] focus:outline-none" value={targetType} onChange={(e) => { setTargetType(e.target.value); setTargetId(''); }}>
                <option value="PROVIDER">Provider</option>
                <option value="BOOKING">Booking</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Select Target</label>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1d4ed8] focus:outline-none" value={targetId} onChange={(e) => setTargetId(e.target.value)} required>
                <option value="">-- Select --</option>
                {getTargetOptions()}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reason for Report</label>
            <textarea placeholder="Describe the issue in detail..." className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1d4ed8] focus:outline-none" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>

          <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[#1d4ed8] px-5 py-3 font-semibold text-white transition hover:bg-[#1740b8]">
            <FiSend size={18} /> Submit Report
          </button>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Your Previous Reports</h3>

        {reports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {reports.map((r) => {
              const booking = bookings.find((b) => b.id === r.targetId);
              const serviceCategory = booking?.service?.category || 'Unnamed Category';
              const serviceSubcategory = booking?.service?.subcategory || 'Unnamed Subcategory';

              const provider = r.targetType === 'PROVIDER' ? providers?.find((p) => p.id === r.targetId) : null;

              const providerName = provider?.name || provider?.fullName || booking?.provider?.name || booking?.service?.providerName || 'Unknown Provider';
              const date = booking?.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'Unknown Date';
              const status = booking?.status || 'Pending';

              return (
                <div key={r.id} className="rounded-[1.3rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 text-base">{r.targetType === 'BOOKING' ? 'Booking Report' : 'Provider Report'}</h4>
                      {r.targetType === 'PROVIDER' && (<div className="text-sm text-slate-600 mb-2">{providerName}</div>)}

                      {r.targetType === 'BOOKING' && (
                        <div className="text-sm text-slate-600 mb-2">{date} - {providerName}<br />{serviceCategory} ({serviceSubcategory})<br /><span className={`text-xs font-semibold ${status === 'COMPLETED' ? 'text-emerald-600' : status === 'CANCELLED' ? 'text-rose-600' : 'text-amber-600'}`}>{status}</span></div>
                      )}

                      <p className="text-sm text-slate-700 mb-1"><strong>Reason:</strong> {r.reason}</p>
                      <strong className="text-xs text-slate-500">Reported on: {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Unknown Date'}</strong>
                    </div>

                    <div className="mt-3 flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${r.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'}`}>{r.status || 'Pending'}</span>
                      {r.adminResponse && (<p className="text-xs text-slate-600 mt-2 italic text-right">{r.adminResponse}</p>)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-600 italic">No reports yet. Start by submitting your first one.</p>
        )}
      </section>
    </div>
  );
}
