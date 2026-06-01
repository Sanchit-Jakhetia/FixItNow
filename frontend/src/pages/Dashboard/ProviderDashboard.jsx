import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiBriefcase,
  FiClock,
  FiClipboard,
  FiEdit2,
  FiHome,
  FiLogOut,
  FiMapPin,
  FiMessageCircle,
  FiMessageSquare,
  FiPlus,
  FiSave,
  FiStar,
  FiUser,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { BiClipboard } from "react-icons/bi";
import { GiHammerNails } from "react-icons/gi";
import { AiOutlineCheckCircle, AiOutlineRadiusSetting } from "react-icons/ai";
import { MdReviews } from "react-icons/md";

import ChatComponent from "../../components/ChatComponent";
import ChatNotifications from "../../components/ChatNotifications";
import {
  createReport,
  createService,
  deleteReview,
  deleteService,
  getBookingsByProvider,
  getCustomers,
  getMyProfile,
  getProviderAverageRating,
  getProviderDocuments,
  getReportsByUser,
  getReviewsByProvider,
  getServicesByProvider,
  markBookingCompleteByProvider,
  updateBookingStatus,
  updateService,
  updateUser,
} from "../../services/api";

const rustBrown = "#1d4ed8";

const dashboardTabs = [
  { key: "overview", label: "Dashboard", icon: <FiHome /> },
  { key: "bookings", label: "Bookings", icon: <BiClipboard /> },
  { key: "services", label: "My Services", icon: <GiHammerNails /> },
  { key: "messages", label: "Messages", icon: <FiMessageSquare /> },
  { key: "reviews", label: "Reviews", icon: <MdReviews /> },
  //{ key: "reports", label: "Reports", icon: <FiClipboard /> },
  { key: "profile", label: "Profile", icon: <FiUser /> },
];

function parseBookingDateTime(booking) {
  if (!booking?.bookingDate) return null;

  const startTime = booking.timeSlot?.split(" - ")[0] || "12:00 AM";
  const parsed = new Date(`${booking.bookingDate} ${startTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(amount || 0));
}

function getGreeting() {
  const hours = new Date().getHours();
  if (hours < 12) return "Good morning";
  if (hours < 16) return "Good afternoon";
  if (hours < 20) return "Good evening";
  return "Good night";
}

function getRatingStars(rating) {
  return Array.from({ length: 5 }, (_, index) => (
    <FiStar key={index} className={index < Math.round(rating) ? "text-amber-400 fill-current" : "text-slate-300"} />
  ));
}

function DashboardStatCard({ label, value, description, icon, accent }) {
  return (
    <div className="rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} shadow-sm`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function DashboardSection({ title, subtitle, action, children }) {
  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function QuickActionCard({ label, description, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[1.5rem] border border-white/80 bg-white/90 p-5 text-left shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-slate-900">{label}</div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-2xl text-[var(--provider-accent,#1d4ed8)] transition group-hover:bg-[#1d4ed8] group-hover:text-white">
          {icon}
        </div>
      </div>
    </button>
  );
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [reports, setReports] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAdminChat, setShowAdminChat] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ name: "", email: "", location: "" });
  const [token] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const handleOpenAdminChat = () => setShowAdminChat(true);
    window.addEventListener("openAdminChat", handleOpenAdminChat);
    return () => window.removeEventListener("openAdminChat", handleOpenAdminChat);
  }, []);

  useEffect(() => {
    const savedTab = localStorage.getItem("activeTab");
    if (!savedTab) return;

    if (!Number.isNaN(Number(savedTab))) {
      const tabs = ["overview", "bookings", "services", "profile", "reviews", "messages"];
      const index = parseInt(savedTab, 10) - 1;
      if (tabs[index]) setActiveTab(tabs[index]);
    } else if (savedTab === "chat") {
      setActiveTab("messages");
    } else {
      setActiveTab(savedTab);
    }

    localStorage.removeItem("activeTab");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: providerData } = await getMyProfile();
        const providerId = providerData.id;

        const [servicesRes, bookingsRes, reviewsRes, reportsRes, customersRes, docsRes, ratingRes] = await Promise.all([
          getServicesByProvider(providerId),
          getBookingsByProvider(providerId),
          getReviewsByProvider(providerId),
          getReportsByUser(providerId),
          getCustomers(),
          getProviderDocuments(providerId),
          getProviderAverageRating(providerId),
        ]);

        const enrichedProvider = {
          ...providerData,
          servicesCount: servicesRes.data?.length || 0,
          bookingsCount: bookingsRes.data?.length || 0,
          averageRating: ratingRes.data || 0,
        };

        setProvider(enrichedProvider);
        setEditProfileData({
          name: enrichedProvider.name || "",
          email: enrichedProvider.email || "",
          location: enrichedProvider.location || "",
        });
        setServices(servicesRes.data || []);
        setBookings(bookingsRes.data || []);
        setReviews(reviewsRes.data || []);
        setReports(reportsRes.data || []);
        setCustomers(customersRes.data || []);
        setDocuments(docsRes.data || []);
      } catch (err) {
        console.error("Error fetching provider dashboard data:", err);
        setError("Failed to load dashboard data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSaveProfile = async () => {
    try {
      const res = await updateUser(provider.id, editProfileData);
      setProvider((current) => ({ ...current, ...res.data }));
      setIsEditingProfile(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCancelProfile = () => {
    setEditProfileData({
      name: provider?.name || "",
      email: provider?.email || "",
      location: provider?.location || "",
    });
    setIsEditingProfile(false);
  };

  const handleSaveService = async (serviceForm) => {
    const priceValue = Number(serviceForm.price);

    if (!serviceForm.category || !serviceForm.subcategory || !serviceForm.description || !serviceForm.price || !Number.isFinite(priceValue) || priceValue <= 0 || !serviceForm.availability || !serviceForm.location) {
      alert("Please fill in all service fields.");
      return;
    }

    try {
      if (editingService) {
        const res = await updateService(editingService.id, serviceForm);
        setServices((current) => current.map((service) => (service.id === editingService.id ? res.data : service)));
      } else {
        const res = await createService(serviceForm);
        setServices((current) => [...current, res.data]);
      }

      setEditingService(null);
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to save service:", err);
      alert("Failed to save service.");
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      await deleteService(serviceId);
      setServices((current) => current.filter((service) => service.id !== serviceId));
    } catch (err) {
      console.error("Failed to delete service:", err);
      alert("Failed to delete service.");
    }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      setBookings((current) => current.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking)));
    } catch (err) {
      console.error("Failed to update booking status:", err);
      alert("Failed to update booking status.");
    }
  };

  const handleMarkComplete = async (bookingId) => {
    try {
      await markBookingCompleteByProvider(bookingId);
      setBookings((current) => current.map((booking) => (booking.id === bookingId ? { ...booking, providerMarkedComplete: true } : booking)));
    } catch (err) {
      console.error("Failed to mark booking complete:", err);
      alert("Failed to mark booking complete.");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;

    try {
      await deleteReview(reviewId);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert("Failed to delete review.");
    }
  };

  const handleSubmitReport = async (reportForm) => {
    const { targetType, targetId, reason } = reportForm;

    if (!targetType || !targetId || !reason) {
      alert("Please complete the report form.");
      return;
    }

    if (!provider || !provider.id) {
      alert("Provider not loaded yet. Please try again shortly.");
      return;
    }

    try {
      await createReport(provider.id, targetType, targetId, reason);
      const res = await getReportsByUser(provider.id);
      setReports(res.data || []);
      alert("Report submitted successfully.");
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert("Failed to submit report.");
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f3ef] text-slate-700">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f3ef] text-red-600">{error}</div>;
  }

  const completedBookings = bookings.filter((booking) => booking.status?.toLowerCase() === "completed");
  const confirmedBookings = bookings.filter((booking) => booking.status?.toLowerCase() === "confirmed");
  const pendingBookings = bookings.filter((booking) => booking.status?.toLowerCase() === "pending");
  const averageRating = provider?.averageRating || 0;
  const estimatedRevenue = completedBookings.reduce((sum, booking) => sum + Number(booking.service?.price || 0), 0);
  const respectScore = Math.min(100, completedBookings.length * 5 + pendingBookings.length * 2 + Math.min(reviews.length, 5) * averageRating * 4);
  const respectLevel = respectScore >= 80 ? "Star Performer" : respectScore >= 50 ? "Trusted Provider" : "Newcomer";
  const completionRate = bookings.length ? Math.round((completedBookings.length / bookings.length) * 100) : 0;
  const documentCount = documents.length;
  const pendingDocuments = documents.filter((document) => !document.approved && !document.rejected).length;
  const reportCount = reports.length;
  const upcomingBookings = [...bookings]
    .filter((booking) => {
      const bookingDateTime = parseBookingDateTime(booking);
      return bookingDateTime ? bookingDateTime >= new Date() : true;
    })
    .sort((left, right) => {
      const leftDate = parseBookingDateTime(left)?.getTime() || 0;
      const rightDate = parseBookingDateTime(right)?.getTime() || 0;
      return leftDate - rightDate;
    })
    .slice(0, 4);

  const recentReviews = [...reviews].slice(0, 3);
  const activeTabLabel = dashboardTabs.find((tab) => tab.key === activeTab)?.label || "Dashboard";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(29,78,216,0.08),_transparent_28%),linear-gradient(180deg,_#fafcff_0%,_#eff6ff_100%)] text-slate-900">
      <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-orange-200/25 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setActiveTab("overview")} className="flex items-center gap-3 text-left">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2d6cdf] text-white shadow-lg shadow-blue-500/20">
              <FiHome className="text-2xl" />
            </span>
            <span>
              <span className="block text-sm font-medium uppercase tracking-[0.24em] text-slate-500">LocalFixConnect</span>
              <span className="block text-lg font-semibold text-slate-900">Provider Hub</span>
            </span>
          </button>

          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</div>
              <div className="text-sm font-semibold text-slate-900">{upcomingBookings.length} upcoming jobs</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-2 py-1 shadow-sm">
              <ChatNotifications />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5"
            >
              <FiLogOut className="text-base" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-2 rounded-[1.75rem] border border-white/80 bg-white/85 p-2 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-[#2d6cdf] text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <div className="ml-auto hidden items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 lg:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            {activeTabLabel}
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
              <div className="grid gap-0 lg:grid-cols-[1.45fr_1fr]">
                <div className="relative overflow-hidden bg-[linear-gradient(135deg,_#1d4ed8_0%,_#0f766e_55%,_#dbeafe_100%)] p-6 text-white sm:p-8 lg:p-10">
                  <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
                  <div className="relative space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white/90 ring-1 ring-white/20">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      {provider?.verified ? "Verified provider" : "Verification pending"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/75">Provider dashboard</p>
                      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                        {getGreeting()}, {provider?.name || "Provider"}.
                      </h1>
                      <p className="mt-3 max-w-2xl text-base leading-7 text-white/85">
                        Keep bookings moving, refine your services, and monitor customer feedback from a single control center.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => setActiveTab("bookings")} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#1d4ed8] shadow-lg shadow-black/10 transition hover:-translate-y-0.5">
                        <BiClipboard />
                        Review bookings
                      </button>
                      <button type="button" onClick={() => { setEditingService(null); setModalOpen(true); setActiveTab("services"); }} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                        <FiPlus />
                        Add service
                      </button>
                      <button type="button" onClick={() => setActiveTab("messages")} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                        <FiMessageSquare />
                        Open messages
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 bg-[#fcfaf7] p-6 sm:grid-cols-2 lg:grid-cols-1 lg:p-6">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Estimated revenue</span>
                      <FiBriefcase className="text-[#1d4ed8]" />
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-slate-900">₹{formatCurrency(estimatedRevenue)}</div>
                    <p className="mt-1 text-sm text-slate-500">Based on completed bookings and service prices.</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Business snapshot</span>
                      <AiOutlineRadiusSetting className="text-[#1d4ed8]" />
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <div className="text-3xl font-semibold text-slate-900">{respectScore}</div>
                      <div className="pb-1 text-sm text-slate-500">/ 100 respect score</div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-[linear-gradient(90deg,_#2d6cdf,_#8b5cf6)]" style={{ width: `${respectScore}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{respectLevel}</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{documentCount} documents</span>
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">{reportCount} reports</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardStatCard label="Total Revenue" value={`₹${formatCurrency(estimatedRevenue)}`} description={`${completedBookings.length} completed bookings`} icon={<FiBriefcase />} accent="from-emerald-100 to-emerald-200 text-emerald-700" />
              <DashboardStatCard label="Bookings This Month" value={bookings.length} description={`${pendingBookings.length} waiting for action`} icon={<BiClipboard />} accent="from-blue-100 to-blue-200 text-blue-700" />
              <DashboardStatCard label="Average Rating" value={averageRating.toFixed(1)} description={`${reviews.length} total reviews`} icon={<FiStar />} accent="from-amber-100 to-amber-200 text-amber-700" />
              <DashboardStatCard label="Completion Rate" value={`${completionRate}%`} description={`${confirmedBookings.length} confirmed jobs`} icon={<AiOutlineCheckCircle />} accent="from-violet-100 to-violet-200 text-violet-700" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <DashboardSection title="Today's Schedule" subtitle="The next bookings already on your calendar" action={<button type="button" onClick={() => setActiveTab("bookings")} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">View all</button>}>
                <div className="space-y-3">
                  {upcomingBookings.length > 0 ? upcomingBookings.map((booking) => {
                    const bookingDateTime = parseBookingDateTime(booking);
                    return (
                      <div key={booking.id} className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 transition hover:border-slate-300 hover:bg-white sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1d4ed8] shadow-sm ring-1 ring-slate-200">
                            <FiClock />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{booking.customer?.name || booking.customer?.username || "Unknown customer"}</div>
                            <div className="text-sm text-slate-600">{booking.service?.category} - {booking.service?.subcategory}</div>
                            <div className="mt-1 text-sm text-slate-500">{bookingDateTime ? bookingDateTime.toLocaleString() : `${booking.bookingDate || "No date"} · ${booking.timeSlot || "No time slot"}`}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">{booking.status || "PENDING"}</span>
                          <button type="button" onClick={() => setActiveTab("bookings")} className="rounded-full bg-[#2d6cdf] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5">View</button>
                        </div>
                      </div>
                    );
                  }) : <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">No upcoming bookings yet.</div>}
                </div>
              </DashboardSection>

              <div className="space-y-6">
                <DashboardSection title="Recent Reviews" subtitle="What customers are saying right now" action={<button type="button" onClick={() => setActiveTab("reviews")} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">All reviews</button>}>
                  <div className="space-y-4">
                    {recentReviews.length > 0 ? recentReviews.map((review) => (
                      <div key={review.id} className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold text-slate-900">{review.customer?.name || "Anonymous"}</div>
                          <div className="flex items-center gap-1">{getRatingStars(review.rating)}</div>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{review.comment}</p>
                      </div>
                    )) : <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">No reviews yet.</div>}
                  </div>
                </DashboardSection>

                <DashboardSection title="Business Health" subtitle="Service, document, and report snapshot">
                  <div className="space-y-4">
                    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Respect score</span>
                        <span className="font-semibold text-slate-900">{respectLevel}</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white">
                        <div className="h-2 rounded-full bg-[linear-gradient(90deg,_#f59e0b,_#ef4444)]" style={{ width: `${respectScore}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                      <div className="rounded-[1.2rem] bg-white p-3 shadow-sm ring-1 ring-slate-200"><div className="text-xl font-semibold text-slate-900">{services.length}</div><div className="text-slate-500">Services</div></div>
                      <div className="rounded-[1.2rem] bg-white p-3 shadow-sm ring-1 ring-slate-200"><div className="text-xl font-semibold text-slate-900">{documentCount}</div><div className="text-slate-500">Docs</div></div>
                      <div className="rounded-[1.2rem] bg-white p-3 shadow-sm ring-1 ring-slate-200"><div className="text-xl font-semibold text-slate-900">{reportCount}</div><div className="text-slate-500">Reports</div></div>
                    </div>
                    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 text-sm text-slate-600">Keep your availability updated and finish confirmed jobs on time to raise your completion rate. {pendingDocuments > 0 ? `${pendingDocuments} documents still need attention.` : "All documents are reviewed."}</div>
                  </div>
                </DashboardSection>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <QuickActionCard label="Manage Availability" description="Open services and update working hours." icon={<FiClock />} onClick={() => setActiveTab("services")} />
              <QuickActionCard label="Update Services" description="Add, edit, or remove the jobs you offer." icon={<FiPlus />} onClick={() => { setEditingService(null); setModalOpen(true); setActiveTab("services"); }} />
              <QuickActionCard label="View Insights" description="Check bookings, reviews, and report volume." icon={<FiClipboard />} onClick={() => setActiveTab("reports")} />
            </section>
          </div>
        )}

        {activeTab === "services" && (
          <ServicesTab
            services={services}
            onAdd={() => { setEditingService(null); setModalOpen(true); }}
            onEdit={(service) => { setEditingService(service); setModalOpen(true); }}
            onDelete={handleDeleteService}
            modalOpen={modalOpen}
            editingService={editingService}
            onCloseModal={() => { setModalOpen(false); setEditingService(null); }}
            onSaveService={handleSaveService}
          />
        )}

        {activeTab === "bookings" && (
          <BookingsTab bookings={bookings} onStatusChange={handleBookingStatus} onMarkComplete={handleMarkComplete} />
        )}

        {activeTab === "profile" && (
          <ProfileTab
            provider={provider}
            isEditingProfile={isEditingProfile}
            setIsEditingProfile={setIsEditingProfile}
            editProfileData={editProfileData}
            setEditProfileData={setEditProfileData}
            onSave={handleSaveProfile}
            onCancel={handleCancelProfile}
          />
        )}

        {activeTab === "reviews" && <ReviewsTab reviews={reviews} onDelete={handleDeleteReview} />}

        {activeTab === "messages" && (
          <MessagesTab customers={customers} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} token={token} />
        )}

        {activeTab === "reports" && (
          provider ? (
            <ReportsTab provider={provider} customers={customers} bookings={bookings} reports={reports} onSubmit={handleSubmitReport} />
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">Loading reports…</div>
          )
        )}
      </main>

      {showAdminChat && (
        <div className="fixed bottom-20 right-6 z-50 flex h-[36rem] w-[29rem] max-w-[90vw] flex-col rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-2xl">
          <button type="button" onClick={() => setShowAdminChat(false)} className="flex justify-end text-slate-400 transition hover:text-rose-500">
            <FiX size={20} />
          </button>
          <div className="flex flex-1 items-center justify-center">
            <ChatComponent token={token} receiverId={13} theme="admin" />
          </div>
        </div>
      )}

    </div>
  );
}

function ServicesTab({ services, onAdd, onEdit, onDelete, modalOpen, editingService, onCloseModal, onSaveService }) {
  const [serviceForm, setServiceForm] = useState({ category: "", subcategory: "", description: "", price: "", availability: "", location: "" });

  useEffect(() => {
    if (editingService) {
      setServiceForm({ ...editingService });
    } else {
      setServiceForm({ category: "", subcategory: "", description: "", price: "", availability: "", location: "" });
    }
  }, [editingService, modalOpen]);

  const subcategoryOptions = {
    Plumbing: ["Pipe Repair", "Faucet Installation"],
    Electrical: ["Wiring", "Appliance Repair"],
    Carpentry: ["Furniture Repair"],
    Cleaning: ["Home Cleaning"],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">My Services</h2>
          <p className="mt-1 text-sm text-slate-500">Keep your catalog current and easy to browse.</p>
        </div>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-2 rounded-2xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5">
          <FiPlus /> Add Service
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <div key={service.id} className="rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{service.category} - {service.subcategory}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{service.description}</p>
              </div>
              <div className="rounded-2xl bg-[#eff6ff] px-3 py-2 text-sm font-semibold text-[#1d4ed8]">₹{formatCurrency(service.price)}</div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2"><FiClock className="text-[#1d4ed8]" /> {service.availability}</div>
              <div className="flex items-center gap-2"><FiMapPin className="text-[#1d4ed8]" /> {service.location}</div>
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => onEdit(service)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <FiEdit2 /> Edit
              </button>
              <button type="button" onClick={() => onDelete(service.id)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
                <FiXCircle /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <ServiceModal
          serviceForm={serviceForm}
          setServiceForm={setServiceForm}
          subcategoryOptions={subcategoryOptions}
          onClose={onCloseModal}
            onSave={onSaveService}
          isEditing={Boolean(editingService)}
        />
      )}
    </div>
  );
}

const DAY_OPTIONS = [
  { label: "Mon", value: "Mon" },
  { label: "Tue", value: "Tue" },
  { label: "Wed", value: "Wed" },
  { label: "Thu", value: "Thu" },
  { label: "Fri", value: "Fri" },
  { label: "Sat", value: "Sat" },
  { label: "Sun", value: "Sun" },
];

function parseAvailability(availabilityText) {
  if (!availabilityText) {
    return { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "09:00", endTime: "17:00" };
  }

  const [daysPartRaw, timePartRaw = ""] = availabilityText.includes("|")
    ? availabilityText.split("|").map((part) => part.trim())
    : availabilityText.split(" - ").length === 2
      ? [availabilityText.split(" ")[0], availabilityText.substring(availabilityText.indexOf(" ") + 1)]
      : availabilityText.split(" ");

  const daysPart = daysPartRaw || "";
  const timePart = timePartRaw || "";
  const normalizedDays = daysPart === "Everyday"
    ? DAY_OPTIONS.map((day) => day.value)
    : daysPart === "Mon-Fri"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri"]
      : daysPart === "Sat-Sun"
        ? ["Sat", "Sun"]
        : daysPart.split(",").map((day) => day.trim()).filter(Boolean);

  const [startDisplay = "09.00 am", endDisplay = "05.00 pm"] = timePart.split("-").map((part) => part.trim());

  return {
    days: normalizedDays.length ? normalizedDays : ["Mon", "Tue", "Wed", "Thu", "Fri"],
    startTime: convertDisplayTimeToInput(startDisplay),
    endTime: convertDisplayTimeToInput(endDisplay),
  };
}

function convertDisplayTimeToInput(timeText) {
  const match = timeText.match(/(\d{1,2})\.(\d{2})\s*(am|pm)/i);
  if (!match) return "09:00";

  let hours = Number(match[1]);
  const minutes = match[2];
  const period = match[3].toLowerCase();

  if (period === "pm" && hours !== 12) hours += 12;
  if (period === "am" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function formatTimeForDisplay(timeValue) {
  if (!timeValue) return "";

  const [hourPart, minutePart] = timeValue.split(":");
  let hours = Number(hourPart);
  const period = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `${hours}.${minutePart} ${period}`;
}

function formatAvailability(days, startTime, endTime) {
  const joinedDays =
    days.length === 7
      ? "Everyday"
      : days.join(",");

  return `${joinedDays} | ${formatTimeForDisplay(startTime)} - ${formatTimeForDisplay(endTime)}`;
}

function ServiceModal({ serviceForm, setServiceForm, subcategoryOptions, onClose, onSave, isEditing }) {
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  useEffect(() => {
    const parsed = parseAvailability(serviceForm.availability);
    setSelectedDays(parsed.days);
    setStartTime(parsed.startTime);
    setEndTime(parsed.endTime);
  }, [serviceForm.availability, isEditing]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this browser.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await response.json();
        setServiceForm((current) => ({
          ...current,
          location: data.display_name || `Lat: ${latitude}, Lon: ${longitude}`,
        }));
      } catch (err) {
        console.error("Failed to resolve location:", err);
      } finally {
        setLocationLoading(false);
      }
    });
  };

  const toggleDay = (day) => {
    setSelectedDays((current) => {
      if (current.includes(day)) {
        return current.filter((item) => item !== day);
      }

      return [...current, day];
    });
  };

  const applyPreset = (preset) => {
    if (preset === "weekday") setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    if (preset === "weekend") setSelectedDays(["Sat", "Sun"]);
    if (preset === "everyday") setSelectedDays(DAY_OPTIONS.map((day) => day.value));
  };

  const handleSave = () => {
    const availability = formatAvailability(selectedDays, startTime, endTime);
    onSave({
      ...serviceForm,
      availability,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-[1.75rem] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">{isEditing ? "Edit Service" : "Add Service"}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500">
            <FiX />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <select value={serviceForm.category} onChange={(event) => setServiceForm((current) => ({ ...current, category: event.target.value, subcategory: "" }))} className="rounded-2xl border border-slate-200 px-4 py-3">
            <option value="">Select Category</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Carpentry">Carpentry</option>
            <option value="Cleaning">Cleaning</option>
          </select>

          <select value={serviceForm.subcategory} onChange={(event) => setServiceForm((current) => ({ ...current, subcategory: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3">
            <option value="">Select Subcategory</option>
            {(subcategoryOptions[serviceForm.category] || []).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <textarea value={serviceForm.description} onChange={(event) => setServiceForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" rows={4} className="sm:col-span-2 rounded-2xl border border-slate-200 px-4 py-3" />
          <input
            type="text"
            value={serviceForm.price}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (nextValue === "" || /^\d*(\.\d{0,2})?$/.test(nextValue)) {
                setServiceForm((current) => ({ ...current, price: nextValue }));
              }
            }}
            inputMode="decimal"
            placeholder="Price"
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />
          <div className="sm:col-span-2 space-y-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Weekly Availability</h4>
                <p className="text-xs text-slate-500">Choose the days and time range instead of typing the schedule.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => applyPreset("weekday")} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Weekdays</button>
                <button type="button" onClick={() => applyPreset("weekend")} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Weekends</button>
                <button type="button" onClick={() => applyPreset("everyday")} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Everyday</button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedDays.includes(day.value)
                      ? "bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/20"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Start Time</span>
                <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900" />
              </label>
              <span className="hidden justify-self-center text-slate-400 sm:block">to</span>
              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">End Time</span>
                <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900" />
              </label>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
              Preview: <span className="font-semibold text-slate-900">{formatAvailability(selectedDays, startTime, endTime)}</span>
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <input type="text" value={serviceForm.location} onChange={(event) => setServiceForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" className="flex-1 rounded-2xl border border-slate-200 px-4 py-3" />
              <button type="button" onClick={useCurrentLocation} className="rounded-2xl bg-[#eff6ff] px-4 py-3 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]">
                {locationLoading ? "Locating..." : "Use Current"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={handleSave} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] px-4 py-3 font-semibold text-white transition hover:bg-[#1740b8]">
            <FiSave /> {isEditing ? "Update Service" : "Add Service"}
          </button>
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingsTab({ bookings, onStatusChange, onMarkComplete }) {
  if (!bookings.length) {
    return <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No bookings available.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Bookings</h2>
        <p className="mt-1 text-sm text-slate-500">Manage accepted, pending, and completed jobs.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {bookings.map((booking) => {
          const dateTime = parseBookingDateTime(booking);
          const canMarkComplete = booking.status?.toLowerCase() === "confirmed" && !booking.providerMarkedComplete && (!dateTime || dateTime <= new Date());

          return (
            <div key={booking.id} className="rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{booking.customer?.name || booking.customer?.username || "Unknown customer"}</h3>
                  <p className="mt-1 text-sm text-slate-500">{booking.service?.category} - {booking.service?.subcategory}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{booking.status}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2"><FiClock className="text-[#1d4ed8]" /> {booking.bookingDate} · {booking.timeSlot}</div>
                <div className="flex items-center gap-2"><FiMapPin className="text-[#1d4ed8]" /> {booking.service?.location || "Location unavailable"}</div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {booking.status?.toLowerCase() === "pending" && (
                  <>
                    <button type="button" onClick={() => onStatusChange(booking.id, "CONFIRMED")} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Accept</button>
                    <button type="button" onClick={() => onStatusChange(booking.id, "CANCELLED")} className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">Decline</button>
                  </>
                )}

                {canMarkComplete && (
                  <button type="button" onClick={() => onMarkComplete(booking.id)} className="rounded-2xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1740b8]">
                    Mark as Completed
                  </button>
                )}

                {booking.providerMarkedComplete && booking.status?.toLowerCase() === "confirmed" && (
                  <span className="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">Waiting for customer verification</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileTab({ provider, isEditingProfile, setIsEditingProfile, editProfileData, setEditProfileData, onSave, onCancel }) {
  return (
    <DashboardSection title="Profile" subtitle="Update the public details customers see">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,_#1d4ed8,_#0f766e)] p-6 text-white">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-3xl font-semibold">{provider?.name?.charAt(0) || "P"}</div>
          <h3 className="mt-4 text-2xl font-semibold">{provider?.name || "Provider"}</h3>
          <p className="mt-2 text-white/80">{provider?.email}</p>
          <p className="mt-2 text-white/80">{provider?.location || "No location set"}</p>
          <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm">{provider?.verified ? "Verified provider" : "Verification pending"}</div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Basic Details</h3>
              <p className="text-sm text-slate-500">Keep your contact and location details current.</p>
            </div>
            <button type="button" onClick={() => setIsEditingProfile((current) => !current)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <FiEdit2 /> {isEditingProfile ? "Stop Editing" : "Edit Profile"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input disabled={!isEditingProfile} value={editProfileData.name} onChange={(event) => setEditProfileData((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 disabled:bg-slate-50" />
            </Field>
            <Field label="Email">
              <input disabled={!isEditingProfile} value={editProfileData.email} onChange={(event) => setEditProfileData((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 disabled:bg-slate-50" />
            </Field>
            <Field label="Location" className="sm:col-span-2">
              <input disabled={!isEditingProfile} value={editProfileData.location} onChange={(event) => setEditProfileData((current) => ({ ...current, location: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 disabled:bg-slate-50" />
            </Field>
          </div>

          {isEditingProfile && (
            <div className="flex gap-3">
              <button type="button" onClick={onSave} className="inline-flex items-center gap-2 rounded-2xl bg-[#1d4ed8] px-4 py-3 font-semibold text-white transition hover:bg-[#1740b8]">
                <FiSave /> Save Changes
              </button>
              <button type="button" onClick={onCancel} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardSection>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function ReviewsTab({ reviews, onDelete }) {
  if (!reviews.length) {
    return <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No reviews yet.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Reviews</h2>
        <p className="mt-1 text-sm text-slate-500">Customer feedback across your bookings.</p>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-slate-900">{review.customer?.name || "Anonymous"}</div>
                <div className="mt-2 flex items-center gap-1">{getRatingStars(review.rating)}</div>
              </div>
              <button type="button" onClick={() => onDelete(review.id)} className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
                Delete
              </button>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{review.comment}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              {review.service?.category && <span className="rounded-full bg-slate-100 px-3 py-1">{review.service.category}</span>}
              {review.service?.subcategory && <span className="rounded-full bg-slate-100 px-3 py-1">{review.service.subcategory}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesTab({ customers, selectedCustomer, setSelectedCustomer, token }) {
  return (
    <div className="flex min-h-[78vh] flex-col overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:flex-row">
      <div className="w-full border-b border-slate-200 bg-[linear-gradient(180deg,_#f8fbff,_#eef4ff)] p-4 lg:w-[340px] lg:border-b-0 lg:border-r">
        <div className="rounded-[1.5rem] border border-white/70 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Conversation Inbox</h3>
              <p className="text-sm text-slate-500">Select a customer to open the chat thread.</p>
            </div>
            <div className="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
              {customers.length}
            </div>
          </div>
        </div>

        <div className="mt-4 h-[60vh] space-y-2 overflow-y-auto pr-1">
          {customers.length > 0 ? customers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => setSelectedCustomer(customer)}
              className={`group w-full rounded-[1.4rem] p-4 text-left transition-all duration-200 ${selectedCustomer?.id === customer.id ? "bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/25" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold ${selectedCustomer?.id === customer.id ? "bg-white/15 text-white" : "bg-blue-50 text-[#1d4ed8]"}`}>
                    {(customer.name || "C").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{customer.name}</div>
                    <div className={`text-xs ${selectedCustomer?.id === customer.id ? "text-white/75" : "text-slate-500"}`}>Tap to continue the conversation</div>
                  </div>
                </div>
                <div className={`h-3 w-3 rounded-full ${selectedCustomer?.id === customer.id ? "bg-emerald-300" : "bg-slate-300"}`} />
              </div>
            </button>
          )) : <p className="mt-8 text-center text-sm text-slate-500">No active customers</p>}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-stretch justify-center bg-[radial-gradient(circle_at_top,_rgba(29,78,216,0.06),_transparent_35%),linear-gradient(180deg,_#fbfdff,_#f3f7ff)] p-4">
        {selectedCustomer ? (
          <div className="relative flex h-[72vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="absolute right-4 top-4 z-20">
              <button type="button" onClick={() => setSelectedCustomer(null)} className="rounded-full border border-white/30 bg-black/20 p-2 text-white transition hover:bg-black/35">
                <FiX />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-3">
              <ChatComponent token={token} receiverId={selectedCustomer.id} receiverName={selectedCustomer.name} width="100%" height="100%" theme="provider" />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xl rounded-[1.8rem] border border-dashed border-slate-300 bg-white/80 px-8 py-14 text-center text-slate-500 shadow-sm backdrop-blur">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-[#1d4ed8]">
              <FiMessageSquare className="text-2xl" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900">Choose a customer</h4>
            <p className="mt-2 text-sm text-slate-500">Your conversation will appear here with a richer, focused layout.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportsTab({ provider, customers = [], bookings = [], reports = [], onSubmit }) {
  const [reportForm, setReportForm] = useState({ targetType: "CUSTOMER", targetId: "", reason: "" });
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const targetOptions = reportForm.targetType === "CUSTOMER" ? safeCustomers : safeBookings;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(reportForm);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <DashboardSection title="Reports" subtitle="Submit a report and track your own report history">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Target Type">
              <select value={reportForm.targetType} onChange={(event) => setReportForm((current) => ({ ...current, targetType: event.target.value, targetId: "" }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3">
                <option value="CUSTOMER">Customer</option>
                <option value="BOOKING">Booking</option>
              </select>
            </Field>

            <Field label="Target">
              <select value={reportForm.targetId} onChange={(event) => setReportForm((current) => ({ ...current, targetId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3">
                <option value="">Select target</option>
                {targetOptions && targetOptions.length > 0 ? (
                  targetOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {reportForm.targetType === "CUSTOMER"
                        ? `${option.name || option.fullName || option.email || "Customer"}`
                        : `${option.id} - ${option.service?.category || "Booking"} (${option.status || "PENDING"})`}
                    </option>
                  ))
                ) : (
                  <option disabled value="">No targets available</option>
                )}
              </select>
            </Field>
          </div>

          <Field label="Reason">
            <textarea value={reportForm.reason} onChange={(event) => setReportForm((current) => ({ ...current, reason: event.target.value }))} rows={5} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Describe the issue" />
          </Field>

          <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[#1d4ed8] px-4 py-3 font-semibold text-white transition hover:bg-[#1740b8]">
            <FiSend /> Submit Report
          </button>
        </form>
      </DashboardSection>

      <DashboardSection title="Report History" subtitle="Recent reports submitted from this account">
        {Array.isArray(reports) && reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900">{report.targetType || "Report"}</div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{report.status || "PENDING"}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{report.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">No reports submitted yet.</div>
        )}

        <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex items-center gap-2 font-semibold text-slate-900"><FiAlertTriangle className="text-amber-500" /> Useful report targets</div>
          <ul className="mt-3 space-y-2">
            <li>Customer behavior issues</li>
            <li>Problem bookings that need admin attention</li>
            <li>Disputes that should be escalated early</li>
          </ul>
        </div>
      </DashboardSection>
    </div>
  );
}
