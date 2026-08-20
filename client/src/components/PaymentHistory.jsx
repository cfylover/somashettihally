import { useEffect, useState } from "react";
import { getPaymentsByMember } from "../api/paymentApi";
import PaymentReceipt from "./PaymentReceipt";
import Toast from "./Toast";
import {
  FaTimes,
  FaUserAlt,
  FaPhone,
  FaHistory,
  FaMoneyBillWave,
  FaBalanceScale,
  FaCheckCircle,
  FaReceipt,
} from "react-icons/fa";

const EXPECTED_CONTRIBUTION = 2500;

export default function PaymentHistory({ member, onClose }) {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null);

  const fmtIN = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  useEffect(() => {
    if (!member?._id) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getPaymentsByMember(member._id);
        setPayments(data.payments || []);
        setSummary(data.memberSummary || null);
      } catch (err) {
        console.error("❌ Failed to load payment history:", err);
        setError("Failed to load payment history.");
      } finally {
        setLoading(false);
      }
    })();
  }, [member]);

  const totalPaid = Number(summary?.amount ?? member?.amount ?? 0) || 0;
  const balance = Number(summary?.balance ?? member?.balance ?? 0) || 0;
  const status = balance === 0 ? "Paid" : "Pending";

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  return (
    <div className="fixed inset-0 bg-black/85 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl">
        <div className="bg-[#111827] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 flex justify-between items-center">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <FaHistory /> Payment History
            </h2>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
            >
              <FaTimes />
            </button>
          </div>

          <div className="p-6">
            {/* Member summary */}
            <div className="bg-[#0B1120] border border-white/10 rounded-xl p-5 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xl">
                  <FaUserAlt />
                </span>
                <div>
                  <p className="text-lg font-bold text-white">
                    {summary?.name || member?.name || "Member"}
                  </p>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <FaPhone className="text-xs" />
                    {summary?.phone || member?.phone || "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Expected</p>
                  <p className="text-base font-bold text-white">
                    {fmtIN(EXPECTED_CONTRIBUTION)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Total Paid</p>
                  <p className="text-base font-bold text-green-500">{fmtIN(totalPaid)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Balance</p>
                  <p className="text-base font-bold text-red-500">{fmtIN(balance)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Status</p>
                  <p className="text-base font-bold text-green-400 flex items-center justify-center gap-1">
                    <FaCheckCircle className="text-xs" />
                    {status}
                  </p>
                </div>
              </div>
            </div>

            {/* Transactions table */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <p className="text-center text-red-400 py-10">{error}</p>
            ) : payments.length === 0 ? (
              <div className="text-center py-14">
                <FaMoneyBillWave className="text-5xl text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No payments recorded yet.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 text-gray-300">
                      <tr>
                        <th className="text-left p-3">Receipt No.</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-right p-3">Amount</th>
                        <th className="text-left p-3">Method</th>
                        <th className="text-left p-3">Txn ID</th>
                        <th className="text-center p-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p._id} className="border-t border-white/5 hover:bg-white/5 transition">
                          <td className="p-3 font-medium text-amber-400">
                            {p.receiptNumber || "-"}
                          </td>
                          <td className="p-3 text-gray-400">{fmtDate(p.paymentDate || p.date)}</td>
                          <td className="p-3 text-right text-green-400 font-bold">
                            {fmtIN(p.amount)}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-semibold">
                              {p.paymentMethod || p.mode || "Cash"}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400">{p.transactionId || "-"}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setViewReceipt(p)}
                              className="bg-blue-500/15 text-blue-400 hover:bg-blue-500/30 p-2 rounded-lg transition"
                              title="View Receipt"
                            >
                              <FaReceipt />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals footer */}
                <div className="flex flex-wrap gap-4 items-center justify-end mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <FaMoneyBillWave className="text-amber-400" /> Total Paid:
                    <span className="font-bold text-green-500">{fmtIN(totalPaid)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <FaBalanceScale className="text-amber-400" /> Balance:
                    <span className="font-bold text-red-500">{fmtIN(balance)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    Status:
                    <span
                      className={`font-bold ${
                        status === "Paid" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {viewReceipt && (
          <PaymentReceipt
            pay={viewReceipt}
            onClose={() => {
              setViewReceipt(null);
              showToast("Receipt closed");
            }}
          />
        )}
      </div>
    </div>
  );
}

