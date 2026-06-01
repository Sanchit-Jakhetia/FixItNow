import React, { useState, useEffect } from "react";
import { useParams, useNavigate ,useLocation} from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import {
  getAllServices,
  getReviewsByProvider,
  getProviderAverageRating,
  addReview,
  getProviderById,
  createBooking,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function normalizeDayToken(token) {
  const clean = token.trim().toLowerCase();
  const map = {
    sun: "Sun", sunday: "Sun",
    mon: "Mon", monday: "Mon",
    tue: "Tue", tues: "Tue", tuesday: "Tue",
    wed: "Wed", wednesday: "Wed",
    thu: "Thu", thur: "Thu", thurs: "Thu", thursday: "Thu",
    fri: "Fri", friday: "Fri",
    sat: "Sat", saturday: "Sat",
  };
  return map[clean] || null;
}

function expandDayRange(startDay, endDay) {
  const startIndex = DAYS.indexOf(startDay);
  const endIndex = DAYS.indexOf(endDay);
  if (startIndex === -1 || endIndex === -1) return [];
  if (startIndex <= endIndex) return DAYS.slice(startIndex, endIndex + 1);
  return [...DAYS.slice(startIndex), ...DAYS.slice(0, endIndex + 1)];
}

function parseDays(daysText = "") {
  const value = daysText.trim();
  if (!value) return ["Mon", "Tue", "Wed", "Thu", "Fri"];
  if (/everyday/i.test(value)) return [...DAYS];

  const tokens = value.replace(/\s+/g, "").split(",").filter(Boolean);
  const result = [];

  tokens.forEach((token) => {
    if (token.includes("-")) {
      const [left, right] = token.split("-");
      const startDay = normalizeDayToken(left);
      const endDay = normalizeDayToken(right);
      expandDayRange(startDay, endDay).forEach((day) => {
        if (!result.includes(day)) result.push(day);
      });
      return;
    }

    const day = normalizeDayToken(token);
    if (day && !result.includes(day)) result.push(day);
  });

  return result.length ? result : ["Mon", "Tue", "Wed", "Thu", "Fri"];
}

function parseTimeToMinutes(raw = "") {
  const input = raw.trim().toLowerCase().replace(".", ":");
  const match = input.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || "0");
  const period = match[3];
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  if (period) {
    if (period.toLowerCase() === "pm" && hours !== 12) hours += 12;
    if (period.toLowerCase() === "am" && hours === 12) hours = 0;
  }

  return hours * 60 + minutes;
}

function toDisplayTime(minutes) {
  const hours24 = Math.floor(minutes / 60) % 24;
  const min = minutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(min).padStart(2, "0")} ${suffix}`;
}

function parseAvailability(availabilityText = "") {
  const text = String(availabilityText || "").trim();
  if (!text) {
    return {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      slots: ["9:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM"],
    };
  }

  let dayPart = text;
  let timePart = "";

  if (text.includes("|")) {
    const [left, right] = text.split("|");
    dayPart = (left || "").trim();
    timePart = (right || "").trim();
  } else {
    const timeIndex = text.search(/\d{1,2}(?::|\.)?\d{0,2}\s*(?:am|pm)?/i);
    if (timeIndex > 0) {
      dayPart = text.slice(0, timeIndex).replace(/[,-]\s*$/, "").trim();
      timePart = text.slice(timeIndex).trim();
    }
  }

  const days = parseDays(dayPart);
  const rangeMatch = timePart.replace(/\./g, ":").match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  let start = parseTimeToMinutes(rangeMatch?.[1] || "9:00 am");
  let end = parseTimeToMinutes(rangeMatch?.[2] || "5:00 pm");
  if (start == null) start = 9 * 60;
  if (end == null || end <= start) end = start + 60;

  const slots = [];
  for (let cursor = start; cursor + 60 <= end; cursor += 60) {
    slots.push(`${toDisplayTime(cursor)} - ${toDisplayTime(cursor + 60)}`);
  }

  return { days, slots: slots.length ? slots : ["9:00 AM - 10:00 AM"] };
}

function BookingModal({ service, customer, onClose }) {
  const [formData, setFormData] = useState({ bookingDate: "", timeSlot: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const { days: availableDays, slots: availableSlots } = parseAvailability(service.availability || "");
  const minDate = new Date().toISOString().split("T")[0];

  const isDateDisabled = (date) => !availableDays.includes(DAYS[date.getDay()]);

  const handleDateChange = (e) => {
    const selected = new Date(e.target.value);
    if (isDateDisabled(selected)) {
      alert(`Provider is not available on ${DAYS[selected.getDay()]}`);
      setFormData({ ...formData, bookingDate: "", timeSlot: "" });
    } else {
      setFormData({ ...formData, bookingDate: e.target.value, timeSlot: "" });
    }
  };

  const handleSlotSelect = (slot) => setFormData({ ...formData, timeSlot: slot });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!formData.bookingDate || !formData.timeSlot) {
      setMessage("Please select both date and time slot.");
      setLoading(false);
      return;
    }

    try {
      const res = await createBooking({
        customer: { id: customer.id },
        provider: { id: service.providerId || service.id },
        service: { id: service.id },
        bookingDate: formData.bookingDate,
        timeSlot: formData.timeSlot,
        notes: formData.notes,
        status: "PENDING",
      });

      navigate("/booking-summary", {
        state: { booking: { ...res.data, service, providerName: service.providerName || "Provider" } },
      });
      onClose();
    } catch (err) {
      setMessage("Booking failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          ✖
        </button>
        <h2 className="text-2xl font-bold text-center text-[#1d4ed8] mb-3">Book {service.subcategory}</h2>
        <p className="text-center text-gray-500 mb-6">Available: {service.availability || "Not specified"}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1d4ed8] mb-1">Booking Date</label>
            <input
              type="date"
              min={minDate}
              value={formData.bookingDate}
              onChange={handleDateChange}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#1d4ed8] focus:outline-none"
            />
          </div>

          {formData.bookingDate && (
            <div>
              <label className="block text-sm font-semibold text-[#1d4ed8] mb-2">Select Time Slot</label>
              <div className="flex flex-wrap gap-2">
                {availableSlots.map((slot, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSlotSelect(slot)}
                    className={`px-3 py-1 rounded-xl border transition ${
                      formData.timeSlot === slot
                        ? "bg-[#1d4ed8] text-white border-[#1d4ed8]"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-[#dbeafe]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#1d4ed8] mb-1">Notes (Optional)</label>
            <textarea
              rows="3"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#1d4ed8] focus:outline-none"
            />
          </div>

          {message && <p className="text-center text-sm text-red-500 bg-red-50 py-2 rounded-xl">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1d4ed8] text-white font-semibold rounded-2xl shadow hover:bg-[#1740b8] transition"
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}


  function AddReviewSection({ user, providerId, bookingId, selectedService, newReview, setNewReview, handleSubmitReview, hasCompletedBooking, setHasCompletedBooking ,alreadyReviewed,
  setAlreadyReviewed}) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
 
  


  // Existing useEffect stays the same to check booking status
  useEffect(() => {
    const checkCompletedBooking = async () => {
      if (!bookingId || !token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:8081/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return setLoading(false);
        const booking = await res.json();

        const reviewRes = await fetch(
          `http://localhost:8081/api/reviews/booking/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let existingReview = null;
        if (reviewRes.status === 204) existingReview = null;
        else if (reviewRes.ok) existingReview = await reviewRes.json();

        setHasCompletedBooking(
  booking.status?.toUpperCase() === "COMPLETED" &&
  booking.provider?.id === providerId
);
setAlreadyReviewed(existingReview !== null);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id && providerId) checkCompletedBooking();
  }, [user, providerId, bookingId, selectedService?.id]);

  if (loading)
    return <p className="text-center text-gray-400 animate-pulse mt-4">Checking booking status...</p>;
const canReview = hasCompletedBooking && !alreadyReviewed;
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 mt-6 space-y-3 border border-[#dbeafe]">
      <h4 className="font-bold text-[#1d4ed8]">Write a Review</h4>

      {canReview ? (
        <>
          <select
            value={newReview.rating}
            onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
            className="border w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-[#1d4ed8] focus:outline-none"
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} Star{r > 1 ? "s" : ""}</option>
            ))}
          </select>

          <textarea
            value={newReview.comment}
            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
            rows={3}
            placeholder="Write your review..."
            className="border w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-[#1d4ed8] focus:outline-none"
          />

          <button
            onClick={handleSubmitReview}
            className="w-full py-2 bg-[#1d4ed8] text-white font-semibold rounded-2xl hover:bg-[#1740b8] transition"
          >
            Submit
          </button>
        </>
      ) : (
        <p className="text-gray-500 italic mt-3">
          {!hasCompletedBooking
            ? "You can submit a review only after your booking is completed."
            : "You have already submitted a review."}
        </p>
      )}
    </div>
  );
}



export default function ProviderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

   const location = useLocation(); // ✅ add this

  // Booking info from navigation (if coming from Bookings tab)
  const bookingId = location.state?.bookingId;
  const serviceIdFromBooking = location.state?.serviceId;

  const [providerServices, setProviderServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [activeTab, setActiveTab] = useState("services");
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [bookingService, setBookingService] = useState(null);
  const [hasCompletedBooking, setHasCompletedBooking] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [providerDetails, setProviderDetails] = useState(null);



  

  useEffect(() => {
  const fetchData = async () => {
    try {
      const allServices = await getAllServices();
      const services = allServices.data.filter((s) => s.providerId === parseInt(id));
      setProviderServices(services);
      const providerRes = await getProviderById(id);
setProviderDetails(providerRes.data);


      const preSelected = services.find((s) => s.id === serviceIdFromBooking) || services[0];
      setSelectedService(preSelected || null);

      const avgRes = await getProviderAverageRating(id);
      setAverageRating(avgRes.data || 0);

      const reviewsRes = await getReviewsByProvider(id);
      setReviews(reviewsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };
  fetchData();
}, [id, serviceIdFromBooking]);




  const handleSubmitReview = async () => {
    if (!user) return alert("Please log in to submit a review.");
    if (!newReview.comment.trim()) return alert("Please write a comment.");
    try {
      await addReview({
         booking: bookingId ? { id: bookingId } : null,
        customer: { id: user.id },
        provider: { id: parseInt(id) },
        service: { id: selectedService.id },
        rating: newReview.rating,
        comment: newReview.comment,
      });
      setNewReview({ rating: 5, comment: "" });
      const res = await getReviewsByProvider(id);
      setReviews(res.data || []);
      setAlreadyReviewed(true); // mark as reviewed
setHasCompletedBooking(false); // optional, if you want to hide review form
    } catch (err) {
      console.error(err);
      alert("Failed to submit review.");
    }
  };

  const handleBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/customer-dashboard"));

  if (!providerServices.length)
    return <p className="text-center mt-10 text-gray-400 animate-pulse">Loading...</p>;

  const provider = providerServices[0];
  console.log(providerServices);
  const filteredReviews = reviews.filter((r) => r.service?.id === selectedService?.id);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-b from-[#eff6ff] to-white min-h-screen">
      <div className="mb-6">
          <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#1d4ed8] font-semibold hover:text-[#1740b8] transition"
        >
          <FiArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT PANEL */}
        <div className="lg:w-1/3 bg-gradient-to-br from-[#1d4ed8] to-[#1740b8] rounded-3xl p-6 text-center lg:text-left shadow-2xl sticky top-8 h-fit">
          <div className="flex flex-col items-center lg:items-start space-y-4">
            <img
              src={`https://ui-avatars.com/api/?name=${provider.providerName}&background=1d4ed8&color=fff&size=128`}
              alt="Provider"
              className="w-28 h-28 rounded-full border-4 border-white shadow-md"
            />
            <h2 className="text-3xl font-bold text-white">{provider.providerName}</h2>
            <p className="text-white/80">{provider.location}</p>
            <span className="px-3 py-1 bg-white text-[#1d4ed8] rounded-full font-semibold shadow">{provider.category}</span>

            <div className="flex justify-between w-full text-center mt-4">
                    {[
                { label: "Rating", value: averageRating.toFixed(1), color: "text-yellow-300" },
                { label: "Services", value: providerServices.length, color: "text-green-300" },
                { label: "Reviews", value: reviews.length, color: "text-orange-300" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/20 rounded-xl p-3 flex-1 mx-1">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-white/80">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="w-full bg-white/20 p-4 rounded-xl text-white mt-4">
              <h3 className="font-semibold mb-1">⏰ Availability</h3>
              <p>{provider.availability || "Not specified"}</p>
            </div>

            <div className="w-full bg-white/20 p-4 rounded-xl text-white mt-4">
              <h3 className="font-semibold mb-1">👤 About</h3>
              <p className="text-sm">{provider.about || "This provider hasn’t added any details yet."}</p>
            </div>

            <div className="w-full bg-white/20 p-4 rounded-xl text-white mt-4">
              <h3 className="font-semibold mb-1">📞 Contact</h3>
              <p>Email: {providerDetails?.email || "Not available"}</p>
              <p>Phone: {provider.phone || "Not available"}</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="lg:w-2/3 flex-1">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 pb-2 mb-6">
            {["services", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${
                  activeTab === tab
                    ? "bg-[#1d4ed8] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab === "services" ? "Services" : "Reviews"}
              </button>
            ))}
          </div>

          {/* SERVICES TAB */}
          {activeTab === "services" && selectedService && (
            <>
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-[#dbeafe]">
                <h3 className="text-2xl font-bold text-[#1d4ed8] mb-2">{selectedService.subcategory}</h3>
                <p className="text-gray-700 mb-4">{selectedService.description}</p>
                <p className="font-semibold text-[#1d4ed8] text-lg mb-2">Price: ₹{selectedService.price}</p>
                <p className="text-sm text-gray-600 mb-4">Availability: {selectedService.availability || "Not specified"}</p>
                <button
                  onClick={() => setBookingService(selectedService)}
                  className="px-6 py-2 bg-[#1d4ed8] text-white rounded-full hover:bg-[#1740b8] transition"
                >
                  Book Now
                </button>
              </div>

              <h4 className="text-lg font-semibold text-[#1d4ed8] mb-3">Other Services Offered</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {providerServices.filter((s) => s.id !== selectedService.id).map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl shadow p-5 hover:shadow-lg transition border border-[#dbeafe]"
                  >
                    <h3 className="text-lg font-bold text-[#1d4ed8] mb-1">{service.subcategory}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">{service.description}</p>
                    <p className="text-[#1d4ed8] font-semibold mb-3">₹{service.price}</p>
                    <button
                      onClick={() => setSelectedService(service)}
                      className="px-6 py-2 bg-[#1d4ed8] text-white rounded-full hover:bg-[#1740b8] transition"
                    >
                      View Service
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* REVIEWS TAB */}
          {activeTab === "reviews" && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-[#1d4ed8]">
                Reviews for {selectedService?.category} - {selectedService?.subcategory}
              </h4>

              {filteredReviews.length === 0 && (
                <p className="text-gray-400 text-center mt-10 animate-pulse">
                  No reviews for this service yet.
                </p>
              )}

              {filteredReviews.map((r) => {
                const name = r.customer?.name || "Customer";
                return (
                  <div key={r.id} className="bg-white rounded-2xl shadow-sm p-4 border border-[#dbeafe]">
                    <div className="flex gap-3 items-start">
                      <div className="w-10 h-10 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white font-bold">
                        {name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-[#1d4ed8]">{name}</p>
                          <div className="flex text-yellow-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={i < r.rating ? "opacity-100" : "opacity-30"}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{r.comment}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <AddReviewSection
                user={user}
                providerId={parseInt(id)}
                bookingId={bookingId} 
                selectedService={selectedService}
                newReview={newReview}
                setNewReview={setNewReview}
                handleSubmitReview={handleSubmitReview}
                hasCompletedBooking={hasCompletedBooking}
                setHasCompletedBooking={setHasCompletedBooking}
                 alreadyReviewed={alreadyReviewed}
  setAlreadyReviewed={setAlreadyReviewed}
              />
            </div>
          )}
        </div>
      </div>

      {/* BOOKING MODAL */}
      {bookingService && (
        <BookingModal service={bookingService} customer={user} onClose={() => setBookingService(null)} />
      )}
    </div>
  );
}

