import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiHome,
  FiLogOut,
  FiMessageSquare,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { BiClipboard, BiUserCircle } from "react-icons/bi";
import { MdAdminPanelSettings } from "react-icons/md";
import { FaExclamationTriangle } from "react-icons/fa";

import { getAllBookings, getAllServices, getAllUsers } from "../../services/api";
import ChatNotifications from "../../components/ChatNotifications";
import DisputeManagement from "../admin/DisputeManagement";
import BookingsCard from "./components/Admin/BookingsCard";
import UsersCardFull from "./components/Admin/UsersCardFull";
import ServicesCardFull from "./components/Admin/ServicesCardFull";
import AdminChatSection from "./components/admin/AdminChatSection";
import VerifyDocumentsTab from "./components/Admin/VerifyDocumentsTab";
import AdminAnalyticsTab from "./components/Admin/AdminAnalyticsTab";
import ServiceLocationMap from "./components/Admin/ServiceLocationMap";

const adminTabs = [
  { key: "home", label: "Dashboard", icon: <FiHome /> },
  { key: "analytics", label: "Analytics", icon: <FiBarChart2 /> },
  { key: "users", label: "Users", icon: <BiUserCircle /> },
  { key: "services", label: "Services", icon: <MdAdminPanelSettings /> },
  { key: "chat", label: "Messages", icon: <FiMessageSquare /> },
  { key: "verify", label: "Verify Providers", icon: <FiCheckCircle /> },
  { key: "disputes", label: "Disputes", icon: <FaExclamationTriangle /> },
];

function AdminStatCard({ label, value, description, icon, accent }) {
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

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const savedTab = localStorage.getItem("activeTab");
    if (savedTab) {
      const tabs = ["home", "analytics", "users", "services", "chat", "verify", "disputes"];
      if (!Number.isNaN(Number(savedTab))) {
        const index = parseInt(savedTab, 10) - 1;
        if (tabs[index]) setActiveTab(tabs[index]);
      } else if (tabs.includes(savedTab)) {
        setActiveTab(savedTab);
      }
      localStorage.removeItem("activeTab");
    }
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const res = await getAllUsers();
        setUsers(res.data || []);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch users");
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await getAllServices();
        setServices(res.data || []);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch services");
      }
    }
    fetchServices();
  }, []);

  useEffect(() => {
    async function fetchBookings() {
      setLoadingBookings(true);
      try {
        const res = await getAllBookings();
        const sorted = (res.data || []).sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
        setBookings(sorted);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch bookings");
      } finally {
        setLoadingBookings(false);
      }
    }
    fetchBookings();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const providers = useMemo(
    () => users.filter((u) => (u.role || "").toLowerCase() === "provider"),
    [users]
  );

  const verifiedProviders = useMemo(
    () => providers.filter((u) => Boolean(u.verified || u.isVerified)).length,
    [providers]
  );

  const pendingApprovals = useMemo(
    () => providers.filter((u) => !Boolean(u.verified || u.isVerified)).length,
    [providers]
  );

  const pendingBookings = useMemo(
    () => bookings.filter((b) => (b.status || "").toUpperCase() === "PENDING"),
    [bookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter((b) => (b.status || "").toUpperCase() === "COMPLETED"),
    [bookings]
  );

  const cancelledBookings = useMemo(
    () => bookings.filter((b) => (b.status || "").toUpperCase() === "CANCELLED"),
    [bookings]
  );

  const confirmedBookings = useMemo(
    () => bookings.filter((b) => (b.status || "").toUpperCase() === "CONFIRMED"),
    [bookings]
  );

  const completionRate = bookings.length ? Math.round((completedBookings.length / bookings.length) * 100) : 0;
  const activeTabLabel = adminTabs.find((tab) => tab.key === activeTab)?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.12),_transparent_34%),linear-gradient(180deg,_#f8fbff,_#f2f6ff)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 backdrop-blur-xl shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#1d4ed8,_#0ea5e9)] text-lg font-bold text-white shadow-lg shadow-blue-500/25">
              F
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Admin dashboard</div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">LocalFixConnect Control Center</h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</div>
              <div className="text-sm font-semibold text-slate-900">{pendingApprovals} pending approvals</div>
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
          {adminTabs.map((tab) => (
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

        {activeTab === "home" && (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
              <div className="grid gap-0 lg:grid-cols-[1.45fr_1fr]">
                <div className="relative overflow-hidden bg-[linear-gradient(135deg,_#1d4ed8_0%,_#0f766e_55%,_#dbeafe_100%)] p-6 text-white sm:p-8 lg:p-10">
                  <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
                  <div className="relative space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white/90 ring-1 ring-white/20">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      Platform operations
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/75">Admin mission</p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Run quality, safety, and growth from one place.</h2>
                      <p className="mt-3 max-w-2xl text-base leading-7 text-white/85">
                        Monitor platform health, verify providers, resolve disputes, and keep demand flowing smoothly.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => setActiveTab("verify")} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#1d4ed8] shadow-lg shadow-black/10 transition hover:-translate-y-0.5">
                        <FiCheckCircle />
                        Review verifications
                      </button>
                      <button type="button" onClick={() => setActiveTab("disputes")} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                        <FiAlertTriangle />
                        Resolve disputes
                      </button>
                      <button type="button" onClick={() => setActiveTab("chat")} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                        <FiMessageSquare />
                        Open messages
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 bg-[#fcfaf7] p-6 sm:grid-cols-2 lg:grid-cols-1 lg:p-6">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Total services</span>
                      <MdAdminPanelSettings className="text-[#1d4ed8]" />
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-slate-900">{services.length}</div>
                    <p className="mt-1 text-sm text-slate-500">Published services currently visible on platform.</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Completion rate</span>
                      <FiShield className="text-[#1d4ed8]" />
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <div className="text-3xl font-semibold text-slate-900">{completionRate}%</div>
                      <div className="pb-1 text-sm text-slate-500">closed successfully</div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-[linear-gradient(90deg,_#2d6cdf,_#14b8a6)]" style={{ width: `${completionRate}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{pendingBookings.length} pending</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{completedBookings.length} completed</span>
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">{cancelledBookings.length} cancelled</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AdminStatCard label="Total Users" value={users.length} description={`${providers.length} providers onboarded`} icon={<FiUsers />} accent="from-blue-100 to-blue-200 text-blue-700" />
              <AdminStatCard label="Bookings" value={bookings.length} description={`${confirmedBookings.length} confirmed right now`} icon={<BiClipboard />} accent="from-cyan-100 to-cyan-200 text-cyan-700" />
              <AdminStatCard label="Verified Providers" value={verifiedProviders} description={`${pendingApprovals} waiting verification`} icon={<FiCheckCircle />} accent="from-emerald-100 to-emerald-200 text-emerald-700" />
              <AdminStatCard label="Pending Reviews" value={pendingBookings.length} description="Bookings awaiting workflow action" icon={<FiClock />} accent="from-amber-100 to-amber-200 text-amber-700" />
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <DashboardSection title="Recent Bookings" subtitle="Latest customer requests and booking updates">
                <BookingsCard bookings={bookings.slice(0, 5)} loading={loadingBookings} />
              </DashboardSection>

              <DashboardSection title="Booking Status" subtitle="Distribution across the platform in real time">
                <div className="space-y-4">
                  {[
                    { label: "Pending", count: pendingBookings.length, tone: "bg-amber-500" },
                    { label: "Confirmed", count: confirmedBookings.length, tone: "bg-blue-500" },
                    { label: "Completed", count: completedBookings.length, tone: "bg-emerald-500" },
                    { label: "Cancelled", count: cancelledBookings.length, tone: "bg-rose-500" },
                  ].map((item) => {
                    const widthPercent = bookings.length ? (item.count / bookings.length) * 100 : 0;
                    return (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700">{item.label}</span>
                          <span className="font-semibold text-slate-900">{item.count}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-100">
                          <div className={`h-2.5 rounded-full ${item.tone}`} style={{ width: `${widthPercent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DashboardSection>
            </div>

            <DashboardSection
              title="Service Locations"
              subtitle="Coverage map across active service bookings"
              action={
                <button
                  type="button"
                  onClick={() => setActiveTab("analytics")}
                  className="rounded-2xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Open Analytics
                </button>
              }
            >
              <ServiceLocationMap bookings={bookings} users={users} loading={loadingBookings} />
            </DashboardSection>
          </div>
        )}

        {activeTab === "analytics" && <AdminAnalyticsTab />}
        {activeTab === "users" && <UsersCardFull users={users} loading={loadingUsers} setUsers={setUsers} />}
        {activeTab === "services" && <ServicesCardFull services={services} setServices={setServices} />}
        {activeTab === "chat" && <AdminChatSection users={users} />}
        {activeTab === "verify" && <VerifyDocumentsTab />}
        {activeTab === "disputes" && <DisputeManagement />}
      </main>
    </div>
  );
}
