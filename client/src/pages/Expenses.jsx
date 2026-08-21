import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaRupeeSign,
  FaWallet,
  FaCalendarAlt,
  FaHighlighter,
  FaBalanceScale,
  FaTimes,
  FaTag,
  FaUserAlt,
  FaFileInvoiceDollar,
  FaStickyNote,
  FaEye,
} from "react-icons/fa";
import { getExpenses, addExpense, updateExpense, deleteExpense } from "../api/expenseApi";
import ExpenseModal from "../components/ExpenseModal";
import Toast from "../components/Toast";
import { getCurrentUser } from "../utils/auth";
import MobileNav from "../components/MobileNav";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const CATEGORIES = [
  "Decoration", "Sound", "Food", "Lighting",
  "Flowers", "Security", "Transportation", "Others",
];

const CATEGORY_COLORS = {
  Decoration: "#F59E0B",
  Sound: "#3B82F6",
  Food: "#22C55E",
  Lighting: "#EF4444",
  Flowers: "#EC4899",
  Security: "#8B5CF6",
  Transportation: "#06B6D4",
  Others: "#64748B",
};

const PAGE_SIZE = 8;

const formatMoney = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isToday = (d) => {
  if (!d) return false;
  const date = new Date(d);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

export default function Expenses() {
  const user = getCurrentUser();
  const isAdminUser = user?.role === "Admin";

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
      setPage(1);
    } catch (err) {
      console.error("❌ Error fetching expenses:", err);
      showToast("Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...expenses];
    if (category) list = list.filter((e) => e.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          (e.title || "").toLowerCase().includes(q) ||
          (e.paidTo || "").toLowerCase().includes(q) ||
          (e.category || "").toLowerCase().includes(q)
      );
    }
    if (sort === "newest") list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    else if (sort === "oldest") list.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    else if (sort === "highest") list.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    else if (sort === "lowest") list.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));
    return list;
  }, [expenses, search, category, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const summary = useMemo(() => {
    const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const today = expenses
      .filter((e) => isToday(e.date))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const highest = expenses.reduce((max, e) => Math.max(max, Number(e.amount) || 0), 0);
    return { total, today, highest };
  }, [expenses]);

  const totalExpenses = summary.total;
  const remainingBalance =
    (Number(localStorage.getItem("dashCollection")) || 0) +
    (Number(localStorage.getItem("dashSponsor")) || 0) -
    totalExpenses;

  const categoryTotals = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const key = e.category || "Others";
      map[key] = (map[key] || 0) + (Number(e.amount) || 0);
    });
    return map;
  }, [expenses]);

  const allCategories = useMemo(() => {
    const dynamic = Object.keys(categoryTotals).filter((c) => !CATEGORIES.includes(c));
    return [...CATEGORIES.filter((c) => c !== "Others"), ...dynamic, "Others"];
  }, [categoryTotals]);

  const pieData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: Object.keys(categoryTotals).map((c) => CATEGORY_COLORS[c] || "#64748B"),
      borderWidth: 2,
      borderColor: "#ffffff",
    }],
  };

  const barData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      label: "Amount (₹)",
      data: Object.values(categoryTotals),
      backgroundColor: Object.keys(categoryTotals).map((c) => CATEGORY_COLORS[c] || "#64748B"),
      borderRadius: 8,
      maxBarThickness: 46,
    }],
  };

  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString("en-IN", { month: "short" }),
        key: `${d.getFullYear()}-${d.getMonth()}`,
        total: 0,
      });
    }
    expenses.forEach((e) => {
      if (!e.date) return;
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const month = months.find((m) => m.key === key);
      if (month) month.total += Number(e.amount) || 0;
    });
    return months;
  }, [expenses]);

  const lineData = {
    labels: monthlyData.map((m) => m.label),
    datasets: [{
      label: "Monthly Expense (₹)",
      data: monthlyData.map((m) => m.total),
      borderColor: "#F59E0B",
      backgroundColor: "rgba(245,158,11,0.15)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#F59E0B",
      pointRadius: 5,
    }],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 14 } } },
  };

  const barLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 14 } } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
  };

  const cards = [
    { title: "Total Expenses", value: formatMoney(totalExpenses), icon: <FaWallet />, bg: "bg-red-100", text: "text-red-600" },
    { title: "Today's Expense", value: formatMoney(summary.today), icon: <FaCalendarAlt />, bg: "bg-orange-100", text: "text-orange-600" },
    { title: "Highest Expense", value: formatMoney(summary.highest), icon: <FaHighlighter />, bg: "bg-blue-100", text: "text-blue-600" },
    { title: "Remaining Balance", value: formatMoney(remainingBalance), icon: <FaBalanceScale />, bg: "bg-green-100", text: "text-green-600" },
  ];

  const handleAddClick = () => {
    setEditingExpense(null);
    setShowModal(true);
  };

  const handleEditClick = (expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleSave = async (form) => {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense._id, form);
        showToast("Expense updated successfully");
      } else {
        await addExpense(form);
        showToast("Expense added successfully");
      }
      await fetchExpenses();
    } catch (err) {
      console.error("❌ Save error:", err);
      showToast(err.response?.data?.message || "Failed to save expense", "error");
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteExpense(deleteTarget._id);
      showToast("Expense deleted successfully");
      await fetchExpenses();
    } catch (err) {
      console.error("❌ Delete error:", err);
      showToast("Failed to delete expense", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const methodBadge = (method) => {
    if (method === "Cash") return "bg-green-100 text-green-700";
    if (method === "UPI") return "bg-blue-100 text-blue-700";
    return "bg-purple-100 text-purple-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-200 p-4 md:p-8 pt-16 lg:pt-8">
      <MobileNav />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-700 flex flex-wrap items-center gap-3 leading-tight">
              <FaFileInvoiceDollar /> Expenses
            </h1>
            <p className="text-gray-600 mt-1">Shree Vinayaka Geleyara Balaga - Ganapathi Utsav 2026</p>
          </div>
          {isAdminUser && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddClick}
              className="bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-700 hover:to-yellow-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition"
            >
              <FaPlus /> Add Expense
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-lg p-5 flex items-center gap-4"
            >
              <div className={`${card.bg} p-4 rounded-xl`}>
                <span className={`${card.text} text-2xl`}>{card.icon}</span>
              </div>
              <div>
                <p className="text-gray-500 font-medium">{card.title}</p>
                <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-5">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <FaWallet className="text-red-500" /> Category Pie
            </h3>
            <div className="h-72"><Pie data={pieData} options={commonOptions} /></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-lg p-5">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <FaTag className="text-blue-500" /> Category Bar
            </h3>
            <div className="h-72"><Bar data={barData} options={barLineOptions} /></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-lg p-5">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-orange-500" /> Monthly Expense Line
            </h3>
            <div className="h-72"><Line data={lineData} options={barLineOptions} /></div>
          </motion.div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-orange-500">
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by title, paid to, category..."
                className="w-full outline-none"
              />
              {search && <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-700"><FaTimes /></button>}
            </div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Categories</option>
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="highest">Sort: Highest ₹</option>
              <option value="lowest">Sort: Lowest ₹</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-20">
              <FaFileInvoiceDollar className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {search || category ? "No expenses match your filters" : "No Expenses Found"}
              </p>
              <p className="text-gray-400 mt-1">
                {search || category ? "Try different search or filters" : "Click 'Add Expense' to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-600 to-yellow-500 text-white">
                  <tr>
                    <th className="p-4">S.No</th>
                    <th className="text-left p-4">Category</th>
                    <th className="text-left p-4">Title</th>
                    <th>Amount</th>
                    <th>Paid To</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((expense, index) => {
                    const method = expense.paymentMethod === "Bank" ? "Bank" : expense.paymentMethod || "Cash";
                    return (
                      <tr key={expense._id} className="text-center border-b hover:bg-orange-50 transition">
                        <td className="p-3 font-semibold text-gray-500">{(safePage - 1) * PAGE_SIZE + index + 1}</td>
                        <td className="p-3 text-left">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: CATEGORY_COLORS[expense.category] || "#64748B" }}>
                            {expense.category}
                          </span>
                        </td>
                        <td className="p-3 text-left font-semibold">
                          <button onClick={() => setViewTarget(expense)} className="hover:text-orange-600" title="View details">
                            {expense.title}
                          </button>
                        </td>
                        <td className="p-3 text-red-600 font-bold">{formatMoney(expense.amount)}</td>
                        <td className="p-3 text-gray-600">{expense.paidTo || "-"}</td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${methodBadge(method)}`}>{method}</span>
                        </td>
                        <td className="p-3 text-gray-600">{formatDate(expense.date)}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setViewTarget(expense)} title="View" className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition">
                              <FaEye />
                            </button>
                            {isAdminUser && (
                              <>
                                <button onClick={() => handleEditClick(expense)} title="Edit" className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition">
                                  <FaEdit />
                                </button>
                                <button onClick={() => setDeleteTarget(expense)} title="Delete" className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition">
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-40 font-semibold transition">
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => Math.abs(n - safePage) <= 1 || n === 1 || n === totalPages)
                  .map((n, idx, arr) => (
                    <span key={n} className="flex items-center gap-2">
                      {idx > 0 && arr[idx - 1] !== n - 1 && <span className="text-gray-400">...</span>}
                      <button onClick={() => setPage(n)} className={`w-9 h-9 rounded-lg font-bold transition ${safePage === n ? "bg-orange-600 text-white" : "bg-gray-100 hover:bg-orange-100 text-gray-700"}`}>
                        {n}
                      </button>
                    </span>
                  ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-40 font-semibold transition">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ExpenseModal
          editingExpense={editingExpense}
          onClose={() => { setShowModal(false); setEditingExpense(null); }}
          onSave={handleSave}
        />
      )}

      {viewTarget && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-yellow-500 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaFileInvoiceDollar /> Expense Details
              </h2>
              <button onClick={() => setViewTarget(null)} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-4 rounded-full text-white" style={{ backgroundColor: CATEGORY_COLORS[viewTarget.category] || "#64748B" }}>
                  <FaWallet className="text-xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{viewTarget.title}</h3>
                  <span className="px-3 py-1 rounded-full text-white text-xs font-bold" style={{ backgroundColor: CATEGORY_COLORS[viewTarget.category] || "#64748B" }}>
                    {viewTarget.category}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2"><FaRupeeSign className="text-orange-500" /> Amount</p>
                  <p className="font-semibold mt-1 text-red-600">{formatMoney(viewTarget.amount)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2"><FaUserAlt className="text-orange-500" /> Paid To</p>
                  <p className="font-semibold mt-1">{viewTarget.paidTo || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2"><FaWallet className="text-orange-500" /> Payment Method</p>
                  <p className="font-semibold mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${methodBadge(viewTarget.paymentMethod === "Bank" ? "Bank" : viewTarget.paymentMethod || "Cash")}`}>
                      {viewTarget.paymentMethod === "Bank" ? "Bank" : viewTarget.paymentMethod || "Cash"}
                    </span>
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2"><FaCalendarAlt className="text-orange-500" /> Date</p>
                  <p className="font-semibold mt-1">{formatDate(viewTarget.date)}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-500 text-sm flex items-center gap-2"><FaStickyNote className="text-orange-500" /> Description</p>
                <p className="font-semibold mt-1">{viewTarget.description || "-"}</p>
              </div>
              <button onClick={() => setViewTarget(null)} className="w-full bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-700 hover:to-yellow-600 text-white py-3 rounded-xl font-bold transition">
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
            <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FaTrash className="text-red-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Expense?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteTarget.title}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-xl font-semibold transition">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
