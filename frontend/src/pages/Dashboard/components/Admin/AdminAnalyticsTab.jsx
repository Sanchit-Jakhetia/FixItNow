import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiBarChart2, FiDownload, FiUsers, FiTrendingUp, FiCheckCircle, FiMapPin } from "react-icons/fi";
import { BiBuildings, BiTargetLock } from "react-icons/bi";

import {
  getAnalyticsSummary,
  getBookingsPerMonth,
  getTopProviders,
  getTopServices,
  getLocationTrends,
} from "../../../../services/api";

const chartColors = ["#1d4ed8", "#0f766e", "#06b6d4", "#f59e0b", "#8b5cf6", "#ef4444"];

function StatCard({ label, value, icon, accent, note }) {
  return (
    <div className="group rounded-[1.5rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
          <p className="mt-2 text-sm text-slate-500">{note}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} shadow-sm`}>
          <span className="text-2xl text-white">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, badge = "Live data" }) {
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.1)]">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-100/60 blur-3xl" />
      <div className="relative flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {badge}
          </span>
        </div>
        <div className="mb-4 h-px bg-gradient-to-r from-slate-200 via-sky-200 to-transparent" />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

export default function AdminAnalyticsTab({ showOnly }) {
  const [summary, setSummary] = useState({});
  const [bookingsTrend, setBookingsTrend] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const allMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const fetchAnalytics = async () => {
    try {
      const [summaryRes, trendRes, providersRes, servicesRes, locRes] = await Promise.all([
        getAnalyticsSummary(),
        getBookingsPerMonth(),
        getTopProviders(),
        getTopServices(),
        getLocationTrends(),
      ]);

      const raw = summaryRes.data || {};
      const trendData = trendRes.data || [];
      const fullTrend = allMonths.map((month) => {
        const found = trendData.find((entry) => entry.month === month);
        return { month, count: found ? found.count : 0 };
      });

      setSummary({
        totalBookings: raw.totalBookings ?? 0,
        completedBookings: raw.completedBookings ?? 0,
        totalProviders: raw.totalProviders ?? 0,
        totalUsers: raw.totalUsers ?? 0,
      });
      setBookingsTrend(fullTrend);
      setTopProviders(providersRes.data || []);
      setTopServices(servicesRes.data || []);
      setLocations(locRes.data || []);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-lg text-slate-500">
        Loading real-time analytics...
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Total bookings",
      value: formatNumber(summary.totalBookings),
      icon: <FiBarChart2 />,
      accent: "from-blue-600 to-sky-500",
      note: "All booking requests captured on the platform.",
    },
    {
      label: "Completed bookings",
      value: formatNumber(summary.completedBookings),
      icon: <FiCheckCircle />,
      accent: "from-emerald-600 to-teal-500",
      note: "Finished jobs that reached completion.",
    },
    {
      label: "Total providers",
      value: formatNumber(summary.totalProviders),
      icon: <FiUsers />,
      accent: "from-amber-500 to-orange-500",
      note: "Active providers in the marketplace.",
    },
    {
      label: "Total users",
      value: formatNumber(summary.totalUsers),
      icon: <BiBuildings />,
      accent: "from-indigo-600 to-blue-500",
      note: "Customers and providers combined.",
    },
  ];

  const topService = topServices[0];
  const topProvider = topProviders[0];
  const topLocation = locations[0];

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Admin Analytics Report", 14, 15);
    doc.setFontSize(11);

    doc.text("Summary Overview", 14, 25);
    const summaryData = summaryCards.map((card) => [card.label, card.value]);
    autoTable(doc, { startY: 30, head: [["Metric", "Value"]], body: summaryData });

    let nextY = doc.lastAutoTable.finalY + 10;
    doc.text("Monthly Bookings Trend", 14, nextY);
    nextY += 5;
    autoTable(doc, {
      startY: nextY,
      head: [["Month", "Bookings"]],
      body: bookingsTrend.map((booking) => [booking.month, booking.count]),
    });

    nextY = doc.lastAutoTable.finalY + 10;
    doc.text("Top Booked Services", 14, nextY);
    nextY += 5;
    autoTable(doc, {
      startY: nextY,
      head: [["Service Category", "Total Bookings"]],
      body: topServices.map((service) => [service.category, service.totalBookings]),
    });

    nextY = doc.lastAutoTable.finalY + 10;
    doc.text("Top Providers", 14, nextY);
    nextY += 5;
    autoTable(doc, {
      startY: nextY,
      head: [["Provider", "Total Bookings"]],
      body: topProviders.map((provider) => [provider.provider, provider.totalBookings]),
    });

    nextY = doc.lastAutoTable.finalY + 10;
    doc.text("Top Booking Locations", 14, nextY);
    nextY += 5;
    autoTable(doc, {
      startY: nextY,
      head: [["Location", "Booking Count"]],
      body: locations.map((location) => [location.location, location.bookingCount]),
    });

    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
    doc.save("Analytics_Report.pdf");
  };

  const downloadCSV = () => {
    const headers = ["Metric,Value\n"];
    const rows = summaryCards.map((card) => `${card.label},${card.value}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Analytics_Report.csv";
    link.click();
  };

  const charts = [
    {
      key: "topServices",
      title: "Most booked services",
      subtitle: "Category-wise performance overview.",
      chart: (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={topServices}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="category" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(29,78,216,0.06)" }}
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                boxShadow: "0 16px 48px rgba(15,23,42,0.12)",
              }}
            />
            <Bar dataKey="totalBookings" radius={[10, 10, 0, 0]} barSize={36}>
              {topServices.map((_, index) => (
                <Cell key={index} fill={chartColors[index % chartColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: "topProviders",
      title: "Top providers",
      subtitle: "Share of total bookings across providers.",
      chart: (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={topProviders}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={108}
              dataKey="totalBookings"
              nameKey="provider"
              label
            >
              {topProviders.map((_, index) => (
                <Cell key={index} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                boxShadow: "0 16px 48px rgba(15,23,42,0.12)",
              }}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 16 }} />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: "monthlyBookings",
      title: "Monthly booking trends",
      subtitle: "Bookings over the past 12 months.",
      chart: (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={bookingsTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                boxShadow: "0 16px 48px rgba(15,23,42,0.12)",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#1d4ed8"
              strokeWidth={3}
              dot={{ r: 4, stroke: "#1d4ed8", fill: "#dbeafe" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: "locations",
      title: "Top booking locations",
      subtitle: "Cities with the highest activity.",
      chart: (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart layout="vertical" data={locations}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="location" type="category" width={140} tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                boxShadow: "0 16px 48px rgba(15,23,42,0.12)",
              }}
            />
            <Bar dataKey="bookingCount" radius={[0, 12, 12, 0]} barSize={24}>
              {locations.map((_, index) => (
                <Cell key={index} fill={chartColors[index % chartColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
  ];

  const filteredCharts = showOnly ? charts.filter((chart) => chart.key === showOnly) : charts;

  return (
    <div className="space-y-8">
      {!showOnly && (
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,_#1d4ed8_0%,_#0f766e_55%,_#dbeafe_100%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-8">
          <div className="relative">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white/90 ring-1 ring-white/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Live analytics
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/75">Admin analytics</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Track platform performance with a cleaner, faster dashboard.
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-white/85">
                    Monitor bookings, provider activity, and location trends in a layout that matches the rest of the admin experience.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-white/85">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 ring-1 ring-white/20">
                    <FiTrendingUp /> Monthly trend insights
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 ring-1 ring-white/20">
                    <BiTargetLock /> Location performance
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 ring-1 ring-white/20">
                    <FiMapPin /> Provider distribution
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadReport}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5"
                >
                  <FiDownload /> Download PDF
                </button>
                <button
                  onClick={downloadCSV}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <FiDownload /> Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showOnly && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </div>
      )}

      {!showOnly && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Top highlights</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">At a glance</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Current snapshot
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Top provider</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{topProvider?.provider || "No data yet"}</p>
                <p className="mt-1 text-sm text-slate-500">{formatNumber(topProvider?.totalBookings)} bookings</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Top service</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{topService?.category || "No data yet"}</p>
                <p className="mt-1 text-sm text-slate-500">{formatNumber(topService?.totalBookings)} bookings</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Top location</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{topLocation?.location || "No data yet"}</p>
                <p className="mt-1 text-sm text-slate-500">{formatNumber(topLocation?.bookingCount)} bookings</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/80 bg-[linear-gradient(135deg,_#1d4ed8_0%,_#0f766e_100%)] p-5 text-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Refresh cycle</p>
            <div className="mt-3 text-3xl font-semibold tracking-tight">30s</div>
            <p className="mt-2 text-sm leading-6 text-white/85">
              Analytics refresh automatically so the dashboard always reflects the latest activity.
            </p>
          </div>
        </div>
      )}

      <div className={`grid gap-6 ${filteredCharts.length === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
        {filteredCharts.map((card) => (
          <ChartCard key={card.key} title={card.title} subtitle={card.subtitle}>
            {card.chart}
          </ChartCard>
        ))}
      </div>
    </div>
  );
}