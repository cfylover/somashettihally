import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { getPayments } from "../api/paymentApi";
import { getSponsors } from "../api/sponsorApi";
import { getExpenses } from "../api/expenseApi";
import { getActivities } from "../api/activityApi";
import { getNotifications } from "../api/notificationApi";
import { getCurrentUser, clearCurrentUser } from "../utils/auth";
import Toast from "../components/Toast";

import {
  FaRupeeSign,
  FaWallet,
  FaHandHoldingHeart,
  FaCalendarAlt,
  FaBell,
  FaSignOutAlt,
  FaUserCircle,
  FaHome,
  FaMoneyBill,
  FaChartBar,
  FaCog,
  FaPlus,
  FaReceipt,
  FaBalanceScale,
} from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// Format a number as Indian Rupees (₹2,500 / ₹25,000)
const formatIN = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

const EXPENSE_COLORS = ["#F59E0B", "#22C55E", "#3B82F6", "#EF4444", "#a855f7"];

// ─── Animated counter ─────────────────────────────────────────────────────
function Counter({ value, prefix = "" }) {
  const [display, setDisplay] = useState(0);
  const target = Number(value) || 0;
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const to = target;
    prev.current = to;
    const duration = 900;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);

  return (
    <span>
{prefix}
      {display.toLocaleString("en-IN")}
    </span>
  );
}

// ─── Glass card wrapper ───────────────────────────────────────────────────
function GlassCard({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, scale: 1.02 }}
      className={`rounded-[20px] bg-[#111827] border border-white/10 shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-black/60 transition-shadow ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function Dashboard() {
  const user = getCurrentUser();
  const isAdmin = user?.role === "Admin";
  const navigate = useNavigate();
  const location = useLocation();

  const [payments, setPayments] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(new Date());
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

// Fetch real data
  useEffect(() => {
    (async () => {
      try {
const [paymentsList, sponsorsList, expensesList, activitiesList, notificationList] = await Promise.all([
          getPayments(),
          getSponsors(),
          getExpenses(),
          getActivities(),
          getNotifications(),
        ]);
        setPayments(paymentsList);
        setSponsors(sponsorsList);
        setExpenses(expensesList);
        setActivities(activitiesList);
        setNotifications(notificationList);
      } catch (err) {
        console.error("❌ Dashboard fetch error:", err);
        showToast("Failed to load dashboard data", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Derived stats (members removed) ─────────────────────────────────
  const totalTransactions = payments.length;
  const totalCollection = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalSponsors = sponsors.length;
  const totalSponsorAmount = sponsors.reduce((s, sp) => s + (Number(sp.amount) || 0), 0);
  const remainingBalance = totalCollection + totalSponsorAmount - totalExpenses;
  const averagePayment = totalTransactions > 0 ? totalCollection / totalTransactions : 0;
  const now = new Date();
  const upcomingActivities = activities
    .filter((a) => new Date(a.date || 0) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcomingEvents = upcomingActivities.length;
  const nextEvent = upcomingActivities[0] || null;

  // Real expense category breakdown for the Dashboard pie chart
  const expenseBreakdown = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const key = e.category || "Others";
      map[key] = (map[key] || 0) + (Number(e.amount) || 0);
    });
    return map;
  }, [expenses]);
  const expenseLabels = Object.keys(expenseBreakdown);
  const expenseValues = Object.values(expenseBreakdown);
  const expenseColors = expenseLabels.map(
    (c, i) => EXPENSE_COLORS[i % EXPENSE_COLORS.length]
  );

  const recentPayments = [...payments].slice(0, 5);

  const recentNotifications = [...notifications]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5);

  const monthlyCollections = useMemo(() => {
    const totals = new Map();

    payments.forEach((payment) => {
      const paymentDate = payment.paymentDate || payment.date;
      if (!paymentDate) return;

      const date = new Date(paymentDate);
      if (Number.isNaN(date.getTime())) return;

      const key = date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });

      totals.set(key, (totals.get(key) || 0) + (Number(payment.amount) || 0));
    });

    return Array.from(totals, ([label, amount]) => ({ label, amount }));
  }, [payments]);

  // ─── Charts ──────────────────────────────────────────────────────────
  const barData = {
    labels: monthlyCollections.map((item) => item.label),
    datasets: [
      {
        label: "Monthly Collection (₹)",
        data: monthlyCollections.map((item) => item.amount),
        backgroundColor: "#F59E0B",
        hoverBackgroundColor: "#fbbf24",
        borderRadius: 8,
        maxBarThickness: 42,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: "#9ca3af" }, grid: { display: false } },
      y: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(255,255,255,0.06)" } },
    },
  };

  const pieData = {
    labels: expenseLabels,
    datasets: [
      {
        data: expenseValues,
        backgroundColor: expenseColors,
        borderColor: "#111827",
        borderWidth: 3,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#e5e7eb", usePointStyle: true, padding: 14 },
      },
    },
  };

  // ─── Summary cards config ────────────────────────────────────────────
const summaryCards = [
    { title: "Total Collection", value: totalCollection, prefix: "₹", icon: <FaRupeeSign />, color: "from-green-500 to-emerald-600", desc: "Sum of all payments", iconBg: "bg-green-500/15 text-green-400" },
    { title: "Sponsor Amount", value: totalSponsorAmount, prefix: "₹", icon: <FaHandHoldingHeart />, color: "from-orange-400 to-amber-500", desc: "Sum of sponsor contributions", iconBg: "bg-orange-400/15 text-orange-300" },
    { title: "Total Expenses", value: totalExpenses, prefix: "₹", icon: <FaWallet />, color: "from-red-500 to-rose-600", desc: "Sum of all expenses", iconBg: "bg-red-500/15 text-red-400" },
    { title: "Net Balance", value: remainingBalance, prefix: "₹", icon: <FaBalanceScale />, color: "from-purple-500 to-violet-600", desc: "Collection + Sponsors − Expenses", iconBg: "bg-purple-500/15 text-purple-400" },
    { title: "Average Payment", value: averagePayment, prefix: "₹", icon: <FaWallet />, color: "from-yellow-400 to-amber-500", desc: "Average payment amount", iconBg: "bg-yellow-500/15 text-yellow-400" },
    { title: "Total Transactions", value: totalTransactions, icon: <FaMoneyBill />, color: "from-blue-500 to-blue-600", desc: "Recorded payments", iconBg: "bg-blue-500/15 text-blue-400" },
  ];

  // ─── Quick actions ───────────────────────────────────────────────────
  const quickActions = [
    { label: "Add Payment", icon: <FaMoneyBill />, to: "/payments" },
    { label: "Add Sponsor", icon: <FaHandHoldingHeart />, to: "/sponsors" },
    { label: "Generate Receipt", icon: <FaReceipt />, to: "/payments" },
  ];

const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: FaHome },
    { to: "/payments", label: "Payments", icon: FaMoneyBill },
    { to: "/sponsors", label: "Sponsors", icon: FaHandHoldingHeart },
    { to: "/activities", label: "Activities", icon: FaCalendarAlt },
    { to: "/receipts", label: "Receipts", icon: FaReceipt },
    { to: "/notifications", label: "Notifications", icon: FaBell },
    { to: "/expenses", label: "Expenses", icon: FaWallet },
    ...(isAdmin
      ? [
          { to: "/reports", label: "Reports", icon: FaChartBar },
          { to: "/settings", label: "Settings", icon: FaCog },
        ]
      : []),
  ];

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex">
      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/10 bg-[#111827]/80 backdrop-blur-xl px-4 py-6 sticky top-0 h-screen overflow-y-auto">
        <Link to="/dashboard" className="flex items-center gap-3 mb-8 px-2">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-amber-400 flex items-center justify-center text-xl shadow-lg shadow-amber-500/30"
          >
            🕉️
          </motion.div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold leading-tight text-amber-400">Shree Vinayaka Geleyara Balaga</p>
            <p className="text-[10px] text-gray-400 -mt-0.5">Ganapathi Utsav 2026</p>
          </div>
        </Link>

        <p className="text-[10px] uppercase tracking-widest text-gray-500 px-3 mb-3">Menu</p>
        <nav className="flex flex-col gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-gradient-to-r from-amber-500/80 to-[#F59E0B]/30 rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="text-lg" />
                  {link.label}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 p-4">
            <p className="text-amber-300 font-bold text-sm">🙏 Jai Ganesha</p>
            <p className="text-xs text-gray-400 mt-1">Ganapathi Bappa Morya</p>
          </div>
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0B1120]/80 border-b border-white/10 px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/dashboard" className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-amber-400 flex items-center justify-center text-lg">
                🕉️
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold truncate">
                  🙏 Welcome Admin
                </h1>
                <p className="max-w-[58vw] text-amber-400 font-bold text-xs sm:text-sm truncate lg:max-w-none">Shree Vinayaka Geleyara Balaga</p>
                <p className="text-gray-500 text-xs truncate">Ganapathi Utsav 2026</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 md:gap-5 shrink-0">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-200">
                  {clock.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-amber-400 font-bold">
                  {clock.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              </div>
              <button
                onClick={() => showToast("No new notifications")}
                className="relative h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center sm:h-10 sm:w-10"
              >
                <FaBell className="text-amber-400" />
                <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500" />
              </button>
              <div className="hidden h-9 w-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-amber-400 sm:flex items-center justify-center">
                <FaUserCircle />
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-sm font-semibold transition shadow-lg shadow-red-600/20 sm:px-3"
              >
                <FaSignOutAlt />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 pb-24 lg:pb-8">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left 2/3 column */}
              <div className="xl:col-span-2 space-y-6">
                {/* 6 Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {summaryCards.map((card, i) => (
                    <GlassCard key={card.title} delay={i * 0.06}>
                      <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center text-2xl`}>
                            {card.icon}
                          </div>
                          <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${card.color}`} />
                        </div>
                        <p className="text-gray-400 text-sm mt-4">{card.title}</p>
                        <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 break-words">
                          <Counter value={card.value} prefix={card.prefix || ""} />
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">{card.desc}</p>
                      </div>
                    </GlassCard>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GlassCard delay={0.2}>
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                          <FaMoneyBill />
                        </span>
                        Payment Collection
                      </h3>
                      <div className="h-64">
                        <Bar data={barData} options={barOptions} />
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard delay={0.25}>
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center">
                          <FaWallet />
                        </span>
                        Expense Distribution
                      </h3>
                      <div className="h-64">
                        <Pie data={pieData} options={pieOptions} />
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Recent Payments */}
                <GlassCard delay={0.35}>
                  <div className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-green-500/15 text-green-400 flex items-center justify-center">
                          <FaMoneyBill />
                        </span>
                        Recent Payments
                      </h3>
                      <Link to="/payments" className="text-xs text-amber-400 hover:text-amber-300">View all →</Link>
                    </div>
                    {recentPayments.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No payments yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-500 border-b border-white/10">
                              <th className="text-left py-2">Person</th>
                              <th className="text-right py-2">Amount</th>
                              <th className="text-left py-2 pl-4">Date</th>
                              <th className="text-left py-2 pl-4">Method</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentPayments.map((p) => {
                              const name = p.payerName || p.memberName || "Member";
                              return (
                                <tr key={p._id} className="border-b border-white/5 hover:bg-white/5">
                                  <td className="py-3 font-medium">{name}</td>
                                  <td className="py-3 text-right text-green-400">₹{p.amount}</td>
                                  <td className="py-3 pl-4 text-gray-400">{formatDate(p.paymentDate || p.date)}</td>
                                  <td className="py-3 pl-4">
                                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-semibold">
                                      {p.paymentMethod}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* Right 1/3 column */}
              <div className="space-y-6">
                {/* Upcoming Activities */}
                <GlassCard delay={0.3}>
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                        <FaCalendarAlt />
                      </span>
                      Upcoming Activities
                    </h3>
                    {upcomingActivities.length === 0 ? (
                      <p className="text-gray-500 text-center py-6">No upcoming events</p>
                    ) : (
                      <div className="space-y-3">
                        {nextEvent && (
                          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-500/40">
                            <p className="text-[10px] uppercase tracking-widest text-amber-300 font-bold mb-1">
                              ● Next Event
                            </p>
                            <p className="font-bold text-sm text-white">{nextEvent.title}</p>
                            <p className="text-xs text-gray-300 mt-0.5">
                              📅 {formatDate(nextEvent.date)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {nextEvent.startTime ? `🕐 ${nextEvent.startTime}` : ""}
                              {nextEvent.location ? ` · 📍 ${nextEvent.location}` : ""}
                            </p>
                          </div>
                        )}
                        {upcomingActivities.slice(0, 4).map((a) => (
                          <motion.div
                            key={a._id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                          >
                            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl shadow-lg">
                              🕉️
                            </span>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{a.title}</p>
                              <p className="text-xs text-gray-400">{formatDate(a.date)}</p>
                            </div>
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </GlassCard>

{/* Latest Notifications */}
                <GlassCard delay={0.35}>
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                        <FaBell />
                      </span>
                      Latest Notifications
                    </h3>
                    {recentNotifications.length === 0 ? (
                      <p className="text-gray-500 text-center py-6">No notifications yet</p>
                    ) : (
                      <div className="space-y-3">
                        {recentNotifications.map((n) => (
                          <motion.div
                            key={n._id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                          >
                            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xl shadow-lg">
                              <FaBell />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{n.title}</p>
                              <p className="text-xs text-gray-400 truncate">{n.message || "-"}</p>
                              <p className="text-[10px] text-amber-400/80 mt-0.5">
                                {formatDate(n.date)}
                                {n.type ? ` · ${n.type}` : ""}
                              </p>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </GlassCard>

                {/* Quick Actions */}
                <GlassCard delay={0.4}>
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                        <FaPlus />
                      </span>
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {quickActions.map((action, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ y: -4, scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            if (!isAdmin && action.label !== "Generate Receipt") {
                              showToast("Admins only", "error");
                              return;
                            }
                            navigate(action.to);
                          }}
                          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-[#111827] to-[#1f2937] border border-white/10 hover:border-amber-500/50 text-sm font-semibold shadow-lg transition-colors"
                        >
                          <span className="text-2xl text-amber-400">{action.icon}</span>
                          {action.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="px-4 md:px-8 py-6 border-t border-white/10 text-center">
          <p className="text-sm text-gray-400">
            🕉️ <span className="text-amber-400 font-semibold">Shree Vinayaka Geleyara Balaga</span> · Ganapathi Utsav 2026
          </p>
          <p className="text-xs text-gray-600 mt-1">© {new Date().getFullYear()} All rights reserved</p>
        </footer>
      </div>

      {/* Mobile bottom nav */}
      <AnimatePresence>
        <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#111827]/95 backdrop-blur-xl border-t border-white/10 flex justify-around py-2">
          {navLinks.map((link) =>{
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to} className={`px-3 py-2 rounded-xl ${active ? "text-amber-400" : "text-gray-400"}`}>
                <Icon className="text-xl mx-auto" />
                <span className="text-[10px]">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </AnimatePresence>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
