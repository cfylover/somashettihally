import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FaReceipt,
  FaSearch,
  FaEye,
  FaTrash,
  FaUserAlt,
  FaRupeeSign,
  FaCalendarAlt,
  FaFilter,
  FaTimes,
  FaPrint,
  FaDownload,
  FaShareAlt,
} from "react-icons/fa";
import { getReceipts, deleteReceipt } from "../api/receiptApi";
import ReceiptView from "../components/ReceiptView";
import Toast from "../components/Toast";
import { getCurrentUser } from "../utils/auth";
import MobileNav from "../components/MobileNav";

export default function Receipts() {
  const user = getCurrentUser();
  const isAdmin = user?.role === "Admin";

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | payment | sponsor
  const [filterDate, setFilterDate] = useState("");
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const data = await getReceipts();
      setReceipts(data);
    } catch (err) {
      console.error("❌ Error fetching receipts:", err);
      showToast("Failed to load receipts", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Summary ──────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const total = receipts.length;
    const totalAmount = receipts.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const members = receipts.filter((r) => r.sourceType === "payment").length;
    const sponsors = receipts.filter((r) => r.sourceType === "sponsor").length;
    return { total, totalAmount, members, sponsors };
  }, [receipts]);

  // ─── Search + Filter ──────────────────────────────────────────────
  const filteredReceipts = useMemo(() => {
    let rows = receipts;

    // Filter by type
    if (filterType !== "all") {
      rows = rows.filter((r) => r.sourceType === filterType);
    }

    // Filter by date
    if (filterDate) {
      rows = rows.filter((r) => {
        const d = new Date(r.date);
        const fd = new Date(filterDate);
        return (
          d.getFullYear() === fd.getFullYear() &&
          d.getMonth() === fd.getMonth() &&
          d.getDate() === fd.getDate()
        );
      });
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.recipientName.toLowerCase().includes(q) ||
          r.receiptNumber.toLowerCase().includes(q) ||
          r.recipientPhone.toLowerCase().includes(q) ||
          r.paymentMethod.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [receipts, search, filterType, filterDate]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReceipt(deleteTarget._id);
      showToast("✅ Receipt deleted");
      setDeleteTarget(null);
      await fetchReceipts();
    } catch (err) {
      console.error("❌ Delete error:", err);
      showToast("Failed to delete receipt", "error");
    }
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const typeBadge = (type) => {
    return type === "payment"
      ? "bg-green-100 text-green-700"
      : "bg-blue-100 text-blue-700";
  };

  const cards = [
    { title: "Total Receipts", value: summary.total, icon: <FaReceipt />, color: "from-orange-500 to-yellow-500", bg: "bg-orange-100", text: "text-orange-600" },
    { title: "Total Amount", value: `₹${summary.totalAmount.toLocaleString("en-IN")}`, icon: <FaRupeeSign />, color: "from-green-500 to-emerald-500", bg: "bg-green-100", text: "text-green-600" },
    { title: "Member Receipts", value: summary.members, icon: <FaUserAlt />, color: "from-blue-500 to-cyan-500", bg: "bg-blue-100", text: "text-blue-600" },
    { title: "Sponsor Receipts", value: summary.sponsors, icon: <FaRupeeSign />, color: "from-purple-500 to-violet-500", bg: "bg-purple-100", text: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-200 p-4 md:p-8 pt-16 lg:pt-8">
      <MobileNav />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-700 flex flex-wrap items-center gap-3 leading-tight">
            <FaReceipt />
            Receipts
          </h1>
          <p className="text-gray-600 mt-1">
            Shree Vinayaka Geleyara Balaga - Ganapathi Utsav 2026
          </p>
        </div>

        {/* Summary Cards */}
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
                <p className={`text-3xl font-bold ${card.text}`}>{card.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-orange-500">
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, receipt no, phone..."
                className="w-full outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-700">
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-orange-500">
              <FaFilter className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full outline-none bg-transparent"
              >
                <option value="all">All Types (Member + Sponsor)</option>
                <option value="payment">Member Payments</option>
                <option value="sponsor">Sponsor Contributions</option>
              </select>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-orange-500">
              <FaCalendarAlt className="text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full outline-none"
              />
              {filterDate && (
                <button onClick={() => setFilterDate("")} className="text-gray-400 hover:text-gray-700">
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Receipts Table */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-20">
              <FaReceipt className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No Receipts Found</p>
              <p className="text-gray-400 mt-1">
                Receipts are automatically generated for every payment and sponsor contribution
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-600 to-yellow-500 text-white">
                  <tr>
                    <th className="p-4">S.No</th>
                    <th className="text-left p-4">Receipt No</th>
                    <th className="text-left p-4">Name</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((receipt, index) => (
                    <tr key={receipt._id} className="text-center border-b hover:bg-orange-50 transition">
                      <td className="p-4 font-semibold text-gray-500">{index + 1}</td>
                      <td className="p-4 text-left">
                        <span className="font-bold text-orange-700">{receipt.receiptNumber}</span>
                      </td>
                      <td className="p-4 text-left font-semibold text-gray-800">
                        <span className="flex items-center gap-2">
                          <span className="bg-orange-100 text-orange-700 p-2 rounded-full">
                            <FaUserAlt className="text-xs" />
                          </span>
                          {receipt.recipientName}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeBadge(receipt.sourceType)}`}>
                          {receipt.sourceType === "payment" ? "Member" : "Sponsor"}
                        </span>
                      </td>
                      <td className="p-4 text-green-700 font-bold">₹{Number(receipt.amount).toLocaleString("en-IN")}</td>
                      <td className="p-4">{receipt.paymentMethod}</td>
                      <td className="p-4 text-gray-600">{formatDate(receipt.date)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingReceipt(receipt)}
                            title="View"
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition"
                          >
                            <FaEye />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteTarget(receipt)}
                              title="Delete"
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Receipt Modal */}
      {viewingReceipt && (
        <ReceiptView
          receipt={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
            <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FaTrash className="text-red-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Receipt?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete receipt{" "}
              <span className="font-semibold">{deleteTarget.receiptNumber}</span> for{" "}
              <span className="font-semibold">{deleteTarget.recipientName}</span>? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-xl font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
