import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  getPayments,
  addPayment,
  deletePayment,
} from "../api/paymentApi";
import Toast from "../components/Toast";
import PaymentModal from "../components/PaymentModal";
import PaymentReceipt from "../components/PaymentReceipt";
import { getCurrentUser } from "../utils/auth";
import {
  FaRupeeSign,
  FaMoneyBill,
  FaWallet,
  FaExchangeAlt,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUser,
  FaUsers,
  FaReceipt,
  FaDownload,
  FaEye,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";
import MobileNav from "../components/MobileNav";

export default function Payments() {
  const user = getCurrentUser();
  const isAdmin = user?.role === "Admin";

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null);
  const [successPayment, setSuccessPayment] = useState(null);

  // Filters
  const [methodFilter, setMethodFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const paymentsList = await getPayments();
      setPayments(paymentsList);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Top card stats (from Payment transactions) ─────────────────────
  const totalPaymentCount = payments.length;
  const totalCollection = payments.reduce(
    (s, p) => s + (Number(p.amount) || 0),
    0
  );
  const pendingAmount =
    payments
      .filter((p) => (p.status || "Pending") === "Pending")
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalPersons = new Set(payments.map((p) => (p.payerName || "").trim().toLowerCase()).filter(Boolean)).size;

  const cards = [
    { title: "Total Persons", value: totalPersons, isMoney: false, icon: <FaUsers />, color: "from-purple-500 to-violet-600", iconBg: "bg-purple-500/15 text-purple-400" },
    { title: "Total Collection", value: totalCollection, isMoney: true, icon: <FaRupeeSign />, color: "from-amber-500 to-orange-600", iconBg: "bg-amber-500/15 text-amber-400" },
    { title: "Pending Amount", value: pendingAmount, isMoney: true, icon: <FaWallet />, color: "from-red-500 to-rose-600", iconBg: "bg-red-500/15 text-red-400" },
    { title: "Total Payments", value: totalPaymentCount, isMoney: false, icon: <FaMoneyBill />, color: "from-green-500 to-emerald-600", iconBg: "bg-green-500/15 text-green-400" },
  ];

  // ─── Build rows ───────────────────────────────────────────────────
  const rows = useMemo(() => {
    return payments.map((p) => {
      const memberName = p.payerName || p.memberName || "Member";
      const phone = p.phone || "";
      const amount = Number(p.amount) || 0;
      const method = p.paymentMethod || p.mode || "Cash";
      const date = p.paymentDate || p.date;
      const status = p.status || "Pending";
      return {
        _id: p._id,
        receiptNumber: p.receiptNumber || "-",
        memberName,
        phone,
        amount,
        method,
        transactionId: p.transactionId || "-",
        date,
        status,
        pay: p,
      };
    });
  }, [payments]);

  // ─── Search + filters ─────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let out = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (r) =>
          r.memberName.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.receiptNumber.toLowerCase().includes(q) ||
          (r.transactionId || "").toLowerCase().includes(q) ||
          r.method.toLowerCase().includes(q)
      );
    }
    if (methodFilter !== "All") {
      out = out.filter((r) => r.method === methodFilter);
    }
    if (statusFilter !== "All") {
      out = out.filter((r) => r.status === statusFilter);
    }
    if (dateFilter) {
      out = out.filter(
        (r) =>
          new Date(r.date).toISOString().split("T")[0] ===
          new Date(dateFilter).toISOString().split("T")[0]
      );
    }
    return out;
  }, [rows, search, methodFilter, statusFilter, dateFilter]);

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleRecord = async (data) => {
    if (saving) return; // prevent duplicate submissions
    setSaving(true);
    try {
      const res = await addPayment({
        payerName: data.payerName,
        phone: data.phone,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        note: data.note,
        paymentDate: data.paymentDate,
        status: data.status,
      });
      showToast(`✅ Payment recorded successfully! Receipt: ${res.payment?.receiptNumber}`);
      setShowModal(false);
      setSuccessPayment(res.payment || res);
      await fetchAll();
      window.dispatchEvent(new Event("payment-updated"));
    } catch (err) {
      console.error("❌ Payment error:", err.response?.data, err.message);
      showToast(err.response?.data?.message || "Failed to record payment", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deletePayment(confirmDelete._id);
      showToast("✅ Payment deleted successfully");
      setConfirmDelete(null);
      await fetchAll();
      window.dispatchEvent(new Event("payment-updated"));
    } catch (err) {
      console.error("❌ Delete error:", err.response?.data, err.message);
      showToast("Failed to delete payment", "error");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const methodBadge = (method) => {
    if (method === "Cash") return "bg-green-500/15 text-green-400";
    if (method === "UPI") return "bg-blue-500/15 text-blue-400";
    if (method === "Bank Transfer") return "bg-purple-500/15 text-purple-400";
    return "bg-gray-500/15 text-gray-400";
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-4 md:p-8 pt-16 lg:pt-8">
      <MobileNav />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl">
                💰
              </span>
              Payments
            </h1>
            <p className="text-gray-500 mt-1">Shree Vinayaka Geleyara Balaga · Ganapathi Utsav 2026</p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white px-5 py-3 rounded-xl font-bold transition shadow-lg shadow-orange-600/20"
            >
              <FaPlus /> Record Payment
            </button>
          )}
        </div>

        {/* Top cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="rounded-[20px] bg-[#111827] border border-white/10 shadow-xl p-5"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center text-2xl`}>
                  {card.icon}
                </div>
                <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${card.color}`} />
              </div>
              <p className="text-gray-400 text-sm mt-4">{card.title}</p>
              <h2 className="text-3xl font-extrabold mt-1">
                {card.isMoney ? "₹" : ""}
                {card.value.toLocaleString("en-IN")}
              </h2>
            </motion.div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-4 top-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, receipt, txn..."
              className="w-full bg-[#111827] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Payment table */}
        <div className="rounded-[20px] bg-[#111827] border border-white/10 shadow-xl overflow-hidden">
          <div className="p-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-green-500/15 text-green-400 flex items-center justify-center">
                  <FaMoneyBill />
                </span>
                Payment Transactions
              </h3>
              <p className="text-xs text-gray-500 mt-1">{filteredRows.length} transactions</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="text-center py-16">
              <FaMoneyBill className="text-5xl text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-gray-300 border-b border-white/10">
                    <th className="text-left p-4">Receipt No.</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Person</th>
                    <th className="text-left p-4">Phone</th>
                    <th className="text-right p-4">Amount</th>
                    <th className="text-left p-4">Method</th>
                    <th className="text-left p-4">Txn ID</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-center p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row._id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-4 font-medium text-amber-400">{row.receiptNumber}</td>
                      <td className="p-4 text-gray-400">{formatDate(row.date)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                            <FaUser className="text-sm" />
                          </span>
                          <span className="font-medium">{row.memberName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">{row.phone || "-"}</td>
                      <td className="p-4 text-right text-green-400 font-bold">
                        {row.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${methodBadge(row.method)}`}>
                          {row.method}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 max-w-[130px] truncate">{row.transactionId}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            row.status === "Paid"
                              ? "bg-green-500/15 text-green-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewReceipt(row.pay)}
                            className="bg-blue-500/15 text-blue-400 hover:bg-blue-500/30 p-2 rounded-lg transition"
                            title="View Receipt"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => setViewReceipt(row.pay)}
                            className="bg-amber-500/15 text-amber-400 hover:bg-amber-500/30 p-2 rounded-lg transition"
                            title="Download Receipt"
                          >
                            <FaDownload />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => setConfirmDelete(row)}
                              className="bg-red-500/15 text-red-400 hover:bg-red-500/30 p-2 rounded-lg transition"
                              title="Delete"
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

      {/* Record Payment Modal */}
      {showModal && isAdmin && (
        <PaymentModal
          onSave={handleRecord}
          onClose={() => setShowModal(false)}
          saving={saving}
        />
      )}

      {/* Payment Success Modal */}
      {successPayment && (
        <div className="fixed inset-0 bg-black/85 flex justify-center items-center z-[60] p-4">
          <div className="bg-[#111827] border border-white/10 rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/15 flex items-center justify-center mb-4">
              <FaCheckCircle className="text-green-400 text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Payment Successful!</h2>
            <p className="text-gray-400 text-sm mb-5">Your payment has been recorded.</p>

            <div className="bg-[#0B1120] border border-white/10 rounded-xl p-4 space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt No</span>
                <span className="font-bold text-amber-400">{successPayment.receiptNumber || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-green-400">₹{(Number(successPayment.amount) || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-bold ${(successPayment.status || "Pending") === "Paid" ? "text-green-400" : "text-amber-400"}`}>{successPayment.status || "Pending"}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setViewReceipt(successPayment)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl font-bold transition"
              >
                View Receipt
              </button>
              <button
                onClick={() => {
                  setSuccessPayment(null);
                  setShowModal(false);
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111827] border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl"
          >
            <div className="bg-red-500/15 text-red-400 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FaTrash className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold mb-2">Delete Payment?</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete receipt{" "}
              <span className="font-semibold text-amber-400">{confirmDelete.receiptNumber}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-60 py-3 rounded-xl font-bold transition"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Receipt Modal */}
      {viewReceipt && (
        <PaymentReceipt pay={viewReceipt} onClose={() => setViewReceipt(null)} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

