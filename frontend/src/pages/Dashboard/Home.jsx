import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { FiArrowRight, FiAward, FiCheckCircle, FiClock, FiMapPin, FiShield, FiStar, FiUsers } from "react-icons/fi";
import cleaning from "../../images/cleaning.png";
import plumbing from "../../images/plumbing.png";
import electrician from "../../images/electrician.png";
import painting from "../../images/painting.png";
import authSideBg from "../../images/auth_side_bg.png";

const HomePage = ({ customer, onExploreClick }) => {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(customer);
  const [imageErrorMap, setImageErrorMap] = useState({});

  const categories = [
    { name: "Cleaning", img: cleaning, fallbackImg: authSideBg, icon: "🧹", desc: "Deep cleaning and regular upkeep" },
    { name: "Plumbing", img: plumbing, fallbackImg: authSideBg, icon: "🔧", desc: "Leaks, repairs, and fittings" },
    { name: "Electrician", img: electrician, fallbackImg: authSideBg, icon: "⚡", desc: "Wiring, switches, and safety checks" },
    { name: "Painting", img: painting, fallbackImg: authSideBg, icon: "🎨", desc: "Interior and exterior painting" },
  ];

  const stats = [
    { label: "Happy Customers", value: "5,000+", icon: FiUsers },
    { label: "Verified Providers", value: "500+", icon: FiAward },
    { label: "Jobs Completed", value: "10,000+", icon: FiStar },
    { label: "Avg Response", value: "15 mins", icon: FiClock },
  ];

  const highlights = [
    {
      title: "Trusted Professionals",
      text: "Every listed provider goes through profile checks before appearing in search.",
      icon: FiShield,
    },
    {
      title: "Nearby First",
      text: "Discover available experts around your area with smarter location filters.",
      icon: FiMapPin,
    },
    {
      title: "Fast Booking Flow",
      text: "Book in a few taps, then chat directly to align schedule and requirements.",
      icon: FiCheckCircle,
    },
  ];

  const primaryAction = () => {
    if (isLoggedIn && onExploreClick) return onExploreClick();
    if (isLoggedIn) return navigate("/customer-dashboard");
    return navigate("/register");
  };

  const secondaryAction = () => {
    if (isLoggedIn) return navigate("/customer-dashboard");
    return navigate("/login");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(29,78,216,0.08),_transparent_28%),linear-gradient(180deg,_#fafcff_0%,_#eff6ff_100%)] text-slate-900">
      <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-indigo-200/25 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/20 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-3 text-left">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/20">
              <FiMapPin className="text-2xl" />
            </span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-[0.24em] text-[#1d4ed8]">LocalFixConnect</span>
              <span className="block text-lg font-semibold text-slate-900">Smart Home Services</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <button
                onClick={secondaryAction}
                className="rounded-full bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1d4ed8]/25 transition hover:-translate-y-0.5 hover:bg-[#1740b8]"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="rounded-full bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1d4ed8]/25 transition hover:-translate-y-0.5 hover:bg-[#1740b8]"
                >
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full px-4 pb-14 pt-8 sm:px-6 lg:px-10">
        <section className="grid min-h-[calc(100vh-120px)] gap-7 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-7 rounded-[2rem] border border-white/80 bg-white/90 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-10"
          >
            <div className="space-y-4 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#1d4ed8]">
                <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
                Trusted Local Experts
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl" style={{ fontFamily: "'Sora', 'Manrope', sans-serif" }}>
                Find Home Services That Actually Show Up On Time.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Discover verified providers, compare options, and manage every booking from one polished dashboard experience.
              </p>
            </div>

            <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/55 p-3 sm:p-4 lg:mx-0">
              <button
                onClick={primaryAction}
                className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-[#1d4ed8] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#1d4ed8]/30 ring-4 ring-blue-100 transition hover:-translate-y-0.5 hover:bg-[#1740b8]"
              >
                {isLoggedIn ? "Explore Services" : "Get Started"}
                <FiArrowRight className="text-base" />
              </button>
              <button
                onClick={secondaryAction}
                className="min-w-[180px] rounded-full border-2 border-[#1d4ed8]/30 bg-white px-7 py-3.5 text-base font-semibold text-[#1d4ed8] shadow-md shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                {isLoggedIn ? "Open Dashboard" : "Sign in"}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
                  <Icon className="mb-2 text-lg text-[#1d4ed8]" />
                  <div className="text-xl font-semibold text-slate-900">{value}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(140deg,_#1d4ed8_0%,_#1e3a8a_55%,_#0f766e_100%)] p-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:p-8"
          >
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-cyan-200/20 blur-3xl" />

            <div className="relative space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/75">How It Works</p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight">From search to booking in 3 simple steps</h2>
              </div>

              <div className="space-y-3">
                {[
                  "Search by category and location",
                  "Compare ratings and provider profiles",
                  "Book instantly and chat in real time",
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-sm text-white/90">{item}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/70">Support</div>
                  <div className="mt-1 text-lg font-semibold">24/7</div>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/70">Coverage</div>
                  <div className="mt-1 text-lg font-semibold">City Wide</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Popular Today</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {categories.slice(0, 4).map((item) => (
                    <div key={item.name} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white/90">
                      {item.icon} {item.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10">
                  <img src={plumbing} alt="Plumbing service" className="h-24 w-full object-cover" />
                  <div className="p-3">
                    <div className="text-xs uppercase tracking-[0.14em] text-white/70">Fast Booking</div>
                    <div className="text-sm font-semibold">Same-day slots available</div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10">
                  <img src={electrician} alt="Electrician service" className="h-24 w-full object-cover" />
                  <div className="p-3">
                    <div className="text-xs uppercase tracking-[0.14em] text-white/70">Verified Pros</div>
                    <div className="text-sm font-semibold">Top-rated local experts</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d4ed8]">Popular Categories</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Book trusted specialists near you</h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat, index) => (
              <motion.article
                key={cat.name}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 * index }}
                className="group overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.10)]"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={imageErrorMap[cat.name] ? cat.fallbackImg : cat.img}
                    alt={cat.name}
                    onError={() => setImageErrorMap((prev) => ({ ...prev, [cat.name]: true }))}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/15 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-sm">{cat.icon}</span>
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">{cat.name}</h3>
                  <p className="text-sm text-slate-600">{cat.desc}</p>
                  <button
                    onClick={primaryAction}
                    className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1d4ed8] transition group-hover:gap-2"
                  >
                    View providers
                    <FiArrowRight />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {highlights.map(({ title, text, icon: Icon }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 * index }}
              className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.09)]"
            >
              <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1d4ed8]">
                <Icon className="text-xl" />
              </span>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </motion.article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default HomePage;
