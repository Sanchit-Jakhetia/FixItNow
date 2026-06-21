import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import { FiAlertCircle, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import UnifiedPageShell from "../../components/UnifiedPageShell";
import { register } from "../../services/api";

export default function Registration() {
  const [fullname, setFullname] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState(null);

  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [availabilityDays, setAvailabilityDays] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const navigate = useNavigate();

  const getCoordinatesFromLocation = async (loc) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setLatitude(data[0].lat);
        setLongitude(data[0].lon);
      }
    } catch (err) {
      console.error("Error getting coordinates:", err);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: currentLatitude, longitude: currentLongitude } = pos.coords;
        setLatitude(currentLatitude);
        setLongitude(currentLongitude);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${currentLatitude}&lon=${currentLongitude}&format=json`
          );
          const data = await response.json();
          setLocation(data.display_name || `Lat: ${currentLatitude}, Lon: ${currentLongitude}`);
        } catch {
          alert("Failed to retrieve location details.");
        }
      },
      () => alert("Please allow location access.")
    );
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return "";
    const [hour, minute] = timeValue.split(":");
    const numericHour = parseInt(hour, 10);
    const suffix = numericHour >= 12 ? "pm" : "am";
    const formattedHour = ((numericHour + 11) % 12) + 1;
    return `${formattedHour}.${minute.padStart(2, "0")} ${suffix}`;
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (!fullname || !email || !password || !location) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    if (!latitude || !longitude) {
      await getCoordinatesFromLocation(location);
    }

    if (
      role === "PROVIDER" &&
      (!category || !subcategory || !description || !price || !availabilityDays || !startTime || !endTime || !document)
    ) {
      setError("Please fill all provider fields");
      setLoading(false);
      return;
    }

    const formattedAvailability =
      role === "PROVIDER"
        ? `${availabilityDays} ${formatTime(startTime)} - ${formatTime(endTime)}`
        : "";

    const userData = {
      name: fullname,
      email,
      password,
      role,
      location,
      latitude,
      longitude,
      category,
      subcategory,
      description,
      price: role === "PROVIDER" ? parseFloat(price) : undefined,
      availability: formattedAvailability,
    };

    try {
      const response = await register(userData);
      const { userId, role: userRole } = response.data;

      if (userRole === "PROVIDER" && document) {
        const formData = new FormData();
        formData.append("file", document);

        await fetch(`http://localhost:8081/api/auth/upload-documents/${userId}`, {
          method: "POST",
          body: formData,
        });
      }

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <UnifiedPageShell
      gridClassName="lg:grid-cols-[0.92fr_1.08fr]"
      contentClassName="lg:[&>section]:order-2 lg:[&>aside]:order-1"
      rightClassName="p-5 sm:p-6"
      topActions={
        <>
          <Link to="/" className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
            Home
          </Link>
          <Link to="/login" className="rounded-full bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1d4ed8]/20 transition hover:-translate-y-0.5 hover:bg-[#1740b8]">
            Sign in
          </Link>
        </>
      }
      rightContent={
        <div className="flex h-full flex-col justify-between gap-6">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white/90 ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Provider-ready onboarding
            </div>

            <div className="rounded-[1.75rem] border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl shadow-lg shadow-black/10">
                <FiCheckCircle />
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Create your account</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
                Join FixItNow as a customer or provider and keep everything from registration to booking in one consistent flow.
              </p>
            </div>

            <div className="space-y-3">
              {[
                "Choose customer or provider in one step",
                "Add service details and verification documents for provider accounts",
                "Get routed into the right dashboard after login",
              ].map((item) => (
                <div key={item} className="rounded-[1.25rem] border border-white/15 bg-white/10 px-4 py-3 text-sm leading-6 text-white/85 backdrop-blur-md">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/15 bg-black/10 p-4 backdrop-blur-md">
            <div className="text-xs uppercase tracking-[0.24em] text-white/60">What providers gain</div>
            <p className="mt-2 text-sm leading-6 text-white/80">
              A clean way to publish services, track bookings, and complete profile verification before going live.
            </p>
          </div>
        </div>
      }
    >
      <div className="relative z-20 mx-auto flex w-full max-w-2xl flex-col justify-center py-2">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
            <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
            Join the platform
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Create account</h1>
            <p className="mt-3 max-w-2xl text-lg leading-7 text-slate-500">
              Register once to find trusted neighborhood services or offer your own expertise with the same polished dashboard experience.
            </p>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleRegister}
          className="space-y-6"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4"
            >
              <FiAlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
              <p className="text-sm leading-relaxed text-rose-700">{error}</p>
            </motion.div>
          )}

          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FiCheckCircle className="text-[#1d4ed8]" />
              Account Information
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Full Name">
                <TextInput
                  icon={<HiOutlineUser className="text-lg text-slate-400 transition-colors group-focus-within:text-[#1d4ed8]" />}
                  type="text"
                  placeholder="Your full name"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field label="Email Address">
                <TextInput
                  icon={<HiOutlineMail className="text-lg text-slate-400 transition-colors group-focus-within:text-[#1d4ed8]" />}
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field label="Password">
                <div className="relative group">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition-colors group-focus-within:text-[#1d4ed8]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-slate-900 placeholder-slate-400 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
                  >
                    {showPassword ? <HiOutlineEyeOff className="text-xl" /> : <HiOutlineEye className="text-xl" />}
                  </button>
                </div>
              </Field>

              <Field label="Account Type">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
                >
                  <option value="CUSTOMER">Customer (Find Services)</option>
                  <option value="PROVIDER">Service Provider (Offer Services)</option>
                </select>
              </Field>
            </div>

            <Field label="Location">
              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <HiOutlineLocationMarker className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition-colors group-focus-within:text-[#1d4ed8]" />
                  <input
                    type="text"
                    placeholder="Enter your location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={loading}
                  className="whitespace-nowrap rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  Use Current
                </motion.button>
              </div>
            </Field>
          </div>

          <AnimatePresence>
            {role === "PROVIDER" && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
              >
                <div className="space-y-6 rounded-[1.75rem] border border-[#efd9cb] bg-[linear-gradient(180deg,_#fff8f3_0%,_#fdf4eb_100%)] p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <FiCheckCircle className="text-[#1d4ed8]" />
                    Professional Service Details
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <Field label="Category">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={loading}
                        className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
                      >
                        <option value="">Select Category</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Carpentry">Carpentry</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Other">Other</option>
                      </select>
                    </Field>

                    <Field label="Subcategory">
                      <select
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        disabled={loading}
                        className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
                      >
                        <option value="">Select Subcategory</option>
                        {category === "Plumbing" && (
                          <>
                            <option value="Pipe Repair">Pipe Repair</option>
                            <option value="Faucet Installation">Faucet Installation</option>
                          </>
                        )}
                        {category === "Electrical" && (
                          <>
                            <option value="Wiring">Wiring</option>
                            <option value="Appliance Repair">Appliance Repair</option>
                          </>
                        )}
                        {category === "Carpentry" && (
                          <>
                            <option value="Cabinet Making">Cabinet Making</option>
                            <option value="Door Installation">Door Installation</option>
                          </>
                        )}
                        {category === "Cleaning" && (
                          <>
                            <option value="House Cleaning">House Cleaning</option>
                            <option value="Deep Cleaning">Deep Cleaning</option>
                          </>
                        )}
                        {category === "Other" && (
                          <>
                            <option value="General Service">General Service</option>
                            <option value="Custom Request">Custom Request</option>
                          </>
                        )}
                      </select>
                    </Field>
                  </div>

                  <Field label="Description">
                    <textarea
                      placeholder="Describe your services, experience, and expertise..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={loading}
                        className="min-h-[120px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 placeholder-slate-400 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <Field label="Price / Basic (₹)">
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 placeholder-slate-400 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
                      />
                    </Field>

                    <Field label="Availability">
                      <select
                        value={availabilityDays}
                        onChange={(e) => setAvailabilityDays(e.target.value)}
                        disabled={loading}
                        className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
                      >
                        <option value="">Select Days</option>
                        <option value="Mon-Fri">Mon-Fri</option>
                        <option value="Sat-Sun">Sat-Sun</option>
                        <option value="Everyday">Everyday</option>
                      </select>
                    </Field>

                    <Field label="Working Hours" className="md:col-span-3">
                      <div className="grid min-w-0 grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          disabled={loading}
                          title="Start Time"
                          className="min-w-0 w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-semibold tracking-wide text-slate-900 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
                        />
                        <span className="text-center text-slate-400">-</span>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          disabled={loading}
                          title="End Time"
                          className="min-w-0 w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-semibold tracking-wide text-slate-900 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
                        />
                      </div>
                    </Field>
                  </div>

                  <Field label="Proof of Identity / Documentation">
                    <input
                      type="file"
                      onChange={(e) => setDocument(e.target.files?.[0] || null)}
                      disabled={loading}
                      className="block w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-[#1d4ed8] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#1740b8] disabled:opacity-50"
                    />
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1d4ed8] px-4 py-4 text-lg font-semibold text-white shadow-lg shadow-[#1d4ed8]/20 transition-all hover:-translate-y-0.5 hover:bg-[#1740b8] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <FiArrowRight className="h-5 w-5" />
              </>
            )}
          </motion.button>
        </motion.form>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-8 text-center">
            <p className="text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#1d4ed8] transition hover:text-[#1740b8]">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </UnifiedPageShell>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`group block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-700 transition-colors group-focus-within:text-[#1d4ed8]">{label}</span>
      {children}
    </label>
  );
}

function TextInput({ icon, ...props }) {
  return (
    <div className="relative group">
      <span className="absolute left-4 top-1/2 -translate-y-1/2">{icon}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
      />
    </div>
  );
}

