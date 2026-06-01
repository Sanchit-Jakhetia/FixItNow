// src/pages/Dashboard/CustomerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatNotifications from "../../components/ChatNotifications";
import { FiHome, FiLogOut, FiClipboard, FiUser, FiMessageCircle, FiMessageSquare, FiX } from "react-icons/fi";
import ChatComponent from "../../components/ChatComponent";
import { MdMiscellaneousServices } from "react-icons/md";
import { BiHistory } from "react-icons/bi";
import { AiOutlineCheckCircle } from "react-icons/ai";

import {
  getAllServices,
  getMyProfile,
  getBookingsByCustomer,
  getReviewByBookingId,
  addReview,
  getProviderAverageRating,
  updateUser,
  verifyBookingByCustomer,
  getUserById,
  
} from "../../services/api";

const dashboardAccent = "#1d4ed8";

// Re-import split components (moved during refactor)
import MetricCard from "./components/Admin/MetricCard";
import ServicesTab from "./components/Customer/ServicesTab";
import ServiceCard from "./components/Customer/ServiceCard";
import BookingsTab from "./components/Customer/BookingsTab";
import ProfileTab from "./components/Customer/ProfileTab";
import BookingFormModal from "./components/Customer/BookingFormModal";
import ReviewModal from "./components/Customer/ReviewModal";
import ReportsTab from "./components/Customer/ReportsTab";

// --- small geocode cache + helpers used by the dashboard
const geoCache = JSON.parse(localStorage.getItem("geoCache") || "{}");
let lastRequestTime = 0;
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const saveCache = () => localStorage.setItem("geoCache", JSON.stringify(geoCache));

async function geocodeLocation(location) {
  if (!location) return null;
  if (geoCache[location]) return geoCache[location];

  // throttle requests to avoid rate limits. reduced slightly to speed up
  // local development while still being polite to the Nominatim API.
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  const minInterval = 600; // ms between requests
  if (elapsed < minInterval) await sleep(minInterval - elapsed);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
    );
    lastRequestTime = Date.now();
    const data = await res.json();
    if (data && data.length > 0) {
      const coords = { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
      geoCache[location] = coords;
      saveCache();
      return coords;
    }
  } catch (err) {
    console.error("Geocoding error:", err);
  }
  return null;
}

// Haversine distance in kilometers
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


export default function CustomerDashboard() {
  const navigate = useNavigate();

  // core UI state
  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesWithDistance, setServicesWithDistance] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewService, setReviewService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [newReview, setNewReview] = useState("");
  const [showAdminChat, setShowAdminChat] = useState(false);
  const [hoveredServiceId, setHoveredServiceId] = useState(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [sortOption, setSortOption] = useState("rating");
  const [activeTab, setActiveTab] = useState("home");
  const [token] = useState((localStorage.getItem("token") || "").trim());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({});
  const [reviewsMap, setReviewsMap] = useState({});
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Small helper to open review modal
  const openReviewModal = (service) => {
    setReviewService(service);
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewService) return;
    try {
      const res = await addReview({ serviceId: reviewService.id, content: newReview });
      const created = res?.data;
      // Update reviewsMap so BookingsTab no longer shows "Leave a Review"
      try {
        // Try to derive booking id from the created review
        const bookingId = created?.bookingId ?? created?.booking?.id ?? created?.booking?.bookingId ?? created?.booking_id ?? created?.booking?.booking_id;
        if (bookingId) {
          setReviewsMap((prev) => ({ ...prev, [bookingId]: true }));
        } else {
          // Fallback: match by service id to mark the corresponding booking as reviewed
          const svcId = created?.serviceId ?? reviewService.id;
          if (svcId) {
            setReviewsMap((prev) => {
              const copy = { ...prev };
              const matched = bookings.find((b) => b.service?.id === svcId || b.service?.serviceId === svcId);
              if (matched) copy[matched.id] = true;
              return copy;
            });
          }
        }
      } catch (e) {
        console.warn('Could not update reviewsMap after creating review:', e);
      }

      setIsReviewModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to submit review");
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const profileRes = await getMyProfile();
        const profileData = profileRes.data || null;
        setCustomer(profileData);
        setEditProfileData({
          name: profileData?.name || "",
          email: profileData?.email || "",
          location: profileData?.location || "",
        });

        // Guard the bookings call: derive customer id from profile and only call if available
        const customerId = profileData?.id ?? profileData?.userId ?? profileData?.customerId;
        if (customerId) {
          const bRes = await getBookingsByCustomer(customerId);
          const bookingsData = bRes.data || [];
          setBookings(bookingsData);

          // Build reviewsMap by checking each booking for an associated review.
          // We avoid calling the customer-level endpoint to prevent server 500s
          // from surfacing in the client; per-booking checks are smaller and
          // tolerate a broken customer endpoint on the server.
          try {
            const map = {};
            const checks = await Promise.allSettled(
              bookingsData.map((b) => getReviewByBookingId(b.id))
            );
            checks.forEach((res, idx) => {
              if (res.status === 'fulfilled' && res.value && res.value.status === 200) {
                const bookingId = bookingsData[idx].id;
                map[bookingId] = true;
              }
            });
            setReviewsMap(map);
          } catch (e) {
            // If checks fail, fallback to empty map so 'Leave a Review' may show.
            setReviewsMap({});
          }
        } else {
          // Avoid calling the API with `undefined` and default to empty bookings
          setBookings([]);
          setReviewsMap({});
        }

    const sRes = await getAllServices();
const allServices = Array.isArray(sRes.data) ? sRes.data : [];


const verifiedServices = allServices.filter(s => s.providerVerified);
setServices(verifiedServices);

// Initialize with available coordinates for faster UI rendering
setServicesWithDistance(
  verifiedServices.map((s) => ({
    ...s,
    latitude: s.latitude ?? s.lat ?? null,
    longitude: s.longitude ?? s.lon ?? null,
    distance: null,
  }))
);
        // Background: resolve missing coordinates, compute distances and fetch ratings.
        (async () => {
          try {
            // Derive customer coordinates from profile if possible
            let customerCoords = null;
            const custLoc = profileData?.location || profileData?.address || profileData?.city;
            if (custLoc) {
              const cgeo = await geocodeLocation(custLoc);
              if (cgeo) customerCoords = { lat: cgeo.latitude, lon: cgeo.longitude };
            }

            const updated = [...verifiedServices];
            // build unique locations to geocode to avoid duplicate requests
            const locMap = new Map();
            updated.forEach((s, idx) => {
              if (!s.latitude && s.location) {
                if (!locMap.has(s.location)) locMap.set(s.location, []);
                locMap.get(s.location).push(idx);
              }
            });

            for (const [location, idxs] of locMap.entries()) {
              const geo = await geocodeLocation(location);
              if (geo) {
                idxs.forEach((i) => {
                  updated[i].latitude = geo.latitude;
                  updated[i].longitude = geo.longitude;
                });
              }
              // update intermediate state so UI progressively improves
              setServicesWithDistance((prev) =>
                prev.map((p) => {
                  const found = updated.find((u) => u.id === p.id);
                  if (!found) return p;
                  const lat = found.latitude ?? p.latitude;
                  const lon = found.longitude ?? p.longitude;
                  const dist = customerCoords && lat && lon ? haversineKm(customerCoords.lat, customerCoords.lon, lat, lon) : p.distance;
                  return { ...p, latitude: lat, longitude: lon, distance: dist ? Math.round(dist * 10) / 10 : null };
                })
              );
            }

            // Fetch provider average ratings in parallel (unique providers)
            const providerIds = Array.from(new Set(updated.map((s) => s.providerId).filter(Boolean)));
            const ratingPromises = providerIds.map((pid) =>
              (async () => {
                try {
                  const r = await getProviderAverageRating(pid);
                  return { pid, avg: r.data };
                } catch (e) {
                  return { pid, avg: null };
                }
              })()
            );
            const ratingResults = await Promise.all(ratingPromises);
            const ratingMap = {};
            ratingResults.forEach((rr) => {
              if (rr && rr.pid) ratingMap[rr.pid] = rr.avg ?? null;
            });

            setServicesWithDistance((prev) =>
              prev.map((p) => ({ ...p, averageRating: ratingMap[p.providerId] ?? p.averageRating ?? 0 }))
            );

            // Finally compute distances for any services with coordinates but without distance
            setServicesWithDistance((prev) =>
              prev.map((p) => {
                if (p.latitude && p.longitude && customerCoords) {
                  const dist = haversineKm(customerCoords.lat, customerCoords.lon, p.latitude, p.longitude);
                  return { ...p, distance: Math.round(dist * 10) / 10 };
                }
                return p;
              })
            );
          } catch (e) {
            // non-fatal, map will show items with existing coords
            console.warn('Background geocoding failed:', e);
          }
        })();
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSaveProfile = async (updatedData) => {
    try {
      const res = await updateUser(customer.id, updatedData);
      setCustomer(res.data);
      setEditProfileData({
        name: res.data?.name || "",
        email: res.data?.email || "",
        location: res.data?.location || "",
      });
      setIsEditingProfile(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  const handleCancelProfile = () => {
    setEditProfileData({ ...customer });
    setIsEditingProfile(false);
  };

  useEffect(() => {
    const openAdminChatHandler = () => {
      console.log("🟢 Event received: openAdminChat");
      setShowAdminChat(true);
    };

    window.addEventListener("openAdminChat", openAdminChatHandler);

    return () => {
      window.removeEventListener("openAdminChat", openAdminChatHandler);
    };
  }, []);

  // When the user switches to the Bookings tab, re-fetch reviews so that
  // any reviews created elsewhere (for example via the provider page) are
  // reflected immediately in the Bookings UI.
  useEffect(() => {
    const refreshReviews = async () => {
      try {
        const customerId = customer?.id ?? customer?.userId ?? customer?.customerId;
        if (!customerId) return;
        const map = {};
        const checks = await Promise.allSettled(
          bookings.map((b) => getReviewByBookingId(b.id))
        );
        checks.forEach((res, idx) => {
          if (res.status === 'fulfilled' && res.value && res.value.status === 200) {
            map[bookings[idx].id] = true;
          }
        });
        setReviewsMap(map);
      } catch (err) {
        // If anything fails here, fail silently and leave reviewsMap empty.
        setReviewsMap({});
      }
    };

    if (activeTab === 'bookings') refreshReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const dashboardTabs = [
    { name: "Dashboard", icon: <FiHome />, key: "home" },
    { name: "Browse Services", icon: <MdMiscellaneousServices />, key: "services" },
    { name: "My Bookings", icon: <BiHistory />, key: "bookings" },
    { name: "Messages", icon: <FiMessageSquare />, key: "messages" },
    { name: "Profile", icon: <FiUser />, key: "profile" },
    { name: "Reports", icon: <FiClipboard />, key: "reports" },
  ];

  const providerMap = {};
  servicesWithDistance.forEach((service) => {
    const providerId = service.providerId;
    if (!providerId) return;
    providerMap[providerId] = {
      id: providerId,
      name: service.providerName || providerMap[providerId]?.name || `Provider #${providerId}`,
      category: service.category || providerMap[providerId]?.category || "Service Provider",
    };
  });

  bookings.forEach((booking) => {
    const providerId = booking?.service?.providerId || booking?.provider?.id;
    if (!providerId) return;
    providerMap[providerId] = {
      id: providerId,
      name:
        booking?.provider?.name ||
        booking?.service?.providerName ||
        providerMap[providerId]?.name ||
        `Provider #${providerId}`,
      category:
        booking?.service?.category ||
        providerMap[providerId]?.category ||
        "Service Provider",
    };
  });

  const providerContacts = Object.values(providerMap).sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (!providerContacts.length) {
      setSelectedProvider(null);
      return;
    }

    if (!selectedProvider || !providerContacts.some((provider) => provider.id === selectedProvider.id)) {
      setSelectedProvider(providerContacts[0]);
    }
  }, [bookings, servicesWithDistance]);

  const completedCount = bookings.filter((b) => b.status?.toLowerCase() === "completed").length;
  const activeTabLabel = dashboardTabs.find((tab) => tab.key === activeTab)?.name || "Dashboard";

  const handleOpenProviderChat = (provider) => {
    if (!provider?.id) return;
    setSelectedProvider(provider);
    setActiveTab("messages");
  };

  const filteredSortedServices = servicesWithDistance
    .filter((s) => {
      const matchesCategory = s.category?.toLowerCase().includes(categorySearch.toLowerCase());
      const matchesLocation = s.location?.toLowerCase().includes(locationSearch.toLowerCase());
      return matchesCategory && matchesLocation;
    })
    .sort((a, b) => {
      if (sortOption === "rating") return (b.averageRating || 0) - (a.averageRating || 0);
      if (sortOption === "distance") return (a.distance || 0) - (b.distance || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.12),_transparent_34%),linear-gradient(180deg,_#f8fbff,_#f2f6ff)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 backdrop-blur-xl shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#1d4ed8,_#0ea5e9)] text-lg font-bold text-white shadow-lg shadow-blue-500/25">
              F
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Customer dashboard</div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome, {customer?.name || "Guest"}</h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</div>
              <div className="text-sm font-semibold text-slate-900">{services.length} services available</div>
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
              {tab.name}
            </button>
          ))}
          <div className="ml-auto hidden items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 lg:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            {activeTabLabel}
          </div>
        </div>

        {activeTab === "home" && (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
              <div className="grid gap-0 lg:grid-cols-[1.45fr_1fr]">
                <div className="relative overflow-hidden bg-[linear-gradient(135deg,_#1d4ed8_0%,_#0f766e_55%,_#dbeafe_100%)] p-6 text-white sm:p-8 lg:p-10">
                  <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
                  <div className="relative space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white/90 ring-1 ring-white/20">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      Smart discovery enabled
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/75">Customer workspace</p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Find trusted services near you.</h2>
                      <p className="mt-3 max-w-2xl text-base leading-7 text-white/85">
                        Compare providers by ratings and distance, track your bookings, and manage everything from one dashboard.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => setActiveTab("services")} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#1d4ed8] shadow-lg shadow-black/10 transition hover:-translate-y-0.5">
                        <MdMiscellaneousServices />
                        Explore services
                      </button>
                      <button type="button" onClick={() => setActiveTab("bookings")} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                        <BiHistory />
                        View bookings
                      </button>
                      <button type="button" onClick={() => setShowAdminChat(true)} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                        <FiMessageCircle />
                        Contact support
                      </button>
                      <button type="button" onClick={() => setActiveTab("messages")} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                        <FiMessageSquare />
                        Chat with providers
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 bg-[#fcfaf7] p-6 sm:grid-cols-2 lg:grid-cols-1 lg:p-6">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Nearby options</span>
                      <MdMiscellaneousServices className="text-[#1d4ed8]" />
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-slate-900">{filteredSortedServices.length}</div>
                    <p className="mt-1 text-sm text-slate-500">Services matching your current filters.</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Booking progress</span>
                      <AiOutlineCheckCircle className="text-[#1d4ed8]" />
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <div className="text-3xl font-semibold text-slate-900">{bookings.length ? Math.round((completedCount / bookings.length) * 100) : 0}%</div>
                      <div className="pb-1 text-sm text-slate-500">completed</div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-[linear-gradient(90deg,_#2d6cdf,_#14b8a6)]" style={{ width: `${bookings.length ? Math.round((completedCount / bookings.length) * 100) : 0}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{completedCount} completed</span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{bookings.length - completedCount} active</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/80 bg-white/90 p-3.5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Your activity snapshot</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Quick summary of bookings and services.</p>
                </div>
                <div className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
                  Live overview
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                <MetricCard compact title="Total Bookings" value={bookings.length} icon={<FiClipboard style={{ color: dashboardAccent }} />} />
                <MetricCard compact title="Available Services" value={services.length} icon={<MdMiscellaneousServices style={{ color: dashboardAccent }} />} />
                <MetricCard compact title="Completed Bookings" value={completedCount} icon={<AiOutlineCheckCircle style={{ color: dashboardAccent }} />} />
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Top Providers Near You</h2>
                  <p className="mt-1 text-sm text-slate-500">Based on service ratings and your current location radius.</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-600">Sort by:</label>
                  <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <option value="rating">Rating</option>
                    <option value="distance">Distance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredSortedServices.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div>
                      <p className="font-semibold text-slate-900">{s.providerName}</p>
                      <p className="text-sm text-slate-600">{s.category}</p>
                      {s.distance && <p className="text-xs text-slate-500">{s.distance} km away</p>}
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-600">★ {(s.averageRating || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">Recommended For You</h2>
                <p className="mt-1 text-sm text-slate-500">Quick picks from highly-rated verified providers.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {filteredSortedServices.slice(0, 3).map((s) => (
                  <ServiceCard key={s.id} service={s} setMapCenter={() => {}} setHoveredServiceId={() => {}} setSelectedService={setSelectedService} setIsBookingModalOpen={setIsBookingModalOpen} />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "services" && (
          <ServicesTab
            servicesWithDistance={servicesWithDistance}
            hoveredServiceId={hoveredServiceId}
            setHoveredServiceId={setHoveredServiceId}
            categorySearch={categorySearch}
            setCategorySearch={setCategorySearch}
            locationSearch={locationSearch}
            setLocationSearch={setLocationSearch}
            setSelectedService={setSelectedService}
            setIsBookingModalOpen={setIsBookingModalOpen}
            openReviewModal={openReviewModal}
            token={token}
            sortOption={sortOption}
            setSortOption={setSortOption}
          />
        )}

        {activeTab === "bookings" && (
          <BookingsTab
            bookings={bookings}
            setBookings={setBookings}
            reviewsMap={reviewsMap}
            onOpenProviderChat={handleOpenProviderChat}
          />
        )}

        {activeTab === "messages" && (
          <div className="flex min-h-[78vh] flex-col overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:flex-row">
            <div className="w-full border-b border-slate-200 bg-[linear-gradient(180deg,_#f8fbff,_#eef4ff)] p-4 lg:w-[340px] lg:border-b-0 lg:border-r">
              <div className="rounded-[1.5rem] border border-white/70 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Provider Inbox</h3>
                    <p className="text-sm text-slate-500">Select a provider to start a conversation.</p>
                  </div>
                  <div className="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                    {providerContacts.length}
                  </div>
                </div>
              </div>

              <div className="mt-4 h-[60vh] space-y-2 overflow-y-auto pr-1">
                {providerContacts.length > 0 ? providerContacts.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider)}
                    className={`w-full rounded-[1.4rem] p-4 text-left transition-all duration-200 ${
                      selectedProvider?.id === provider.id
                        ? "bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/25"
                        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold ${selectedProvider?.id === provider.id ? "bg-white/15 text-white" : "bg-blue-50 text-[#1d4ed8]"}`}>
                          {(provider.name || "P").slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{provider.name}</div>
                          <div className={`text-xs ${selectedProvider?.id === provider.id ? "text-white/75" : "text-slate-500"}`}>{provider.category}</div>
                        </div>
                      </div>
                      <div className={`h-3 w-3 rounded-full ${selectedProvider?.id === provider.id ? "bg-emerald-300" : "bg-slate-300"}`} />
                    </div>
                  </button>
                )) : <p className="mt-8 text-center text-sm text-slate-500">No providers available yet</p>}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 items-stretch justify-center bg-[radial-gradient(circle_at_top,_rgba(29,78,216,0.06),_transparent_35%),linear-gradient(180deg,_#fbfdff,_#f3f7ff)] p-4">
              {selectedProvider ? (
                <div className="min-h-0 flex-1 overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                  <ChatComponent token={token} receiverId={selectedProvider.id} receiverName={selectedProvider.name} width="100%" height="100%" theme="customer" />
                </div>
              ) : (
                <div className="w-full max-w-xl rounded-[1.8rem] border border-dashed border-slate-300 bg-white/80 px-8 py-14 text-center text-slate-500 shadow-sm backdrop-blur">
                  <h4 className="text-lg font-semibold text-slate-900">Choose a provider</h4>
                  <p className="mt-2 text-sm text-slate-500">Your provider conversation will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <ProfileTab
            customer={customer}
            setCustomer={setCustomer}
            isEditingProfile={isEditingProfile}
            setIsEditingProfile={setIsEditingProfile}
            editProfileData={editProfileData}
            setEditProfileData={setEditProfileData}
            handleSaveProfile={handleSaveProfile}
            handleCancelProfile={handleCancelProfile}
          />
        )}

        {activeTab === "reports" && <ReportsTab user={customer} />}
      </main>

      {isBookingModalOpen && selectedService && (
        <BookingFormModal
          service={selectedService}
          customer={customer}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedService(null);
          }}
        />
      )}

      {isReviewModalOpen && (
        <ReviewModal service={reviewService} reviews={reviews} averageRating={averageRating} onClose={() => setIsReviewModalOpen(false)} newReview={newReview} setNewReview={setNewReview} onSubmit={handleSubmitReview} />
      )}

      {showAdminChat && (
        <div className="fixed bottom-20 right-6 sm:right-10 bg-white shadow-2xl rounded-2xl w-[29rem] max-w-[90vw] h-[36rem] border border-gray-200 p-4 flex flex-col z-50 transition-all duration-300" style={{ transform: "translateY(0)" }}>
          <button onClick={() => setShowAdminChat(false)} className="text-gray-500 hover:text-red-500 transition-colors flex justify-end">
            <FiX size={20} />
          </button>
          <div className="flex justify-center items-center w-full max-w-[90vw]">
            <ChatComponent token={token} receiverId={13} theme={"admin"} />
          </div>
        </div>
      )}

    </div>
  );
}

/* ----------------- NOTES ----------------- */
// This file was reconstructed to fix syntax errors introduced during a large refactor.
// It intentionally keeps logic minimal: moved UI parts into their component files under
// src/pages/Dashboard/components/Customer/. The split components should provide the
// detailed behavior. If you want, I can continue to reintroduce more advanced fetching
// (distance calculations) and client-side caching next.