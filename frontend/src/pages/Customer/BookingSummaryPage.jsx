import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function BookingSummaryPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No booking details found.</p>
      </div>
    );
  }

  const { booking } = state;

  // Format date as "24 Oct 2025"
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return new Date(dateStr).toLocaleDateString("en-GB", options);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#eff6ff] to-white p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 space-y-6 border border-[#dbeafe] ">
        <h2 className="text-3xl font-bold text-[#1d4ed8]">Booking Confirmed!</h2>

        <div>
          <h3 className="font-semibold text-[#1d4ed8]">Service</h3>
          <p className="text-gray-700">{booking.service.subcategory || "Service Name"}</p>
        </div>

        <div>
          <h3 className="font-semibold text-[#1d4ed8]">Provider</h3>
          <p className="text-gray-700">{booking.providerName || "Provider Name"}</p>
        </div>

        <div>
          <h3 className="font-semibold text-[#1d4ed8]">Date & Time</h3>
          <p className="text-gray-700">
            {formatDate(booking.bookingDate)} | {booking.timeSlot}
          </p>
        </div>

        {booking.notes && (
          <div>
            <h3 className="font-semibold text-[#1d4ed8]">Notes</h3>
            <p className="text-gray-700">{booking.notes}</p>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-[#1d4ed8]">Status</h3>
          <p className="text-gray-700">{booking.status || "PENDING"}</p>
        </div>

        <button
          onClick={() => navigate("/customer-dashboard")}
          className="mt-4 w-full py-3 bg-[#1d4ed8] text-white font-semibold rounded-2xl shadow hover:bg-[#1740b8] transition"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
