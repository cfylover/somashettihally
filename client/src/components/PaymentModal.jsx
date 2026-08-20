import { useState } from "react";
import {
  FaRupeeSign,
  FaUserAlt,
  FaPhone,
  FaCalendarAlt,
  FaStickyNote,
  FaTimes,
  FaCashRegister,
  FaCreditCard,
  FaUniversity,
  FaMoneyBillWave,
} from "react-icons/fa";

export default function PaymentModal({ onSave, onClose, saving }) {
  const [payerName, setPayerName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("Pending");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!payerName.trim()) {
      alert("Please enter the person's name.");
      return;
    }
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      alert("Payment amount must be greater than ₹0.");
      return;
    }
    if (saving) return;
    onSave({
      payerName: payerName.trim(),
      phone: phone.trim(),
      amount: amt,
      paymentMethod,
      transactionId,
      note,
      paymentDate,
      status,
    });
  };

  const methods = [
    { key: "Cash", icon: FaCashRegister },
    { key: "UPI", icon: FaCreditCard },
    { key: "Bank Transfer", icon: FaUniversity },
    { key: "Other", icon: FaMoneyBillWave },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg">
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-b from-[#1f2937] to-[#111827] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 flex justify-between items-center">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <FaRupeeSign /> Record Payment
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
            >
              <FaTimes />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Person Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Person Name
              </label>
              <div className="relative">
                <FaUserAlt className="absolute left-4 top-3.5 text-amber-400" />
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Phone <span className="text-gray-600">(Optional)</span>
              </label>
              <div className="relative">
                <FaPhone className="absolute left-4 top-3.5 text-amber-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number..."
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Payment Amount
              </label>
              <div className="relative">
                <FaRupeeSign className="absolute left-4 top-3.5 text-amber-400" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["Pending", "Paid"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex items-center justify-center gap-2 border-2 rounded-xl py-3 text-sm font-semibold transition ${
                      status === s
                        ? s === "Paid"
                          ? "border-green-500 bg-green-500/10 text-green-400"
                          : "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-white/10 text-gray-400 hover:border-amber-500/40"
                    }`}
                  >
                    {s === "Paid" ? "✅" : "⏳"} {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-2">
                {methods.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPaymentMethod(key)}
                    className={`flex flex-col items-center gap-1 border-2 rounded-xl py-3 text-[10px] font-semibold transition ${
                      paymentMethod === key
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-white/10 text-gray-400 hover:border-amber-500/40"
                    }`}
                  >
                    <Icon className="text-lg" />
                    {key === "Bank Transfer" ? "Bank" : key}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction ID + Date row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Transaction ID <span className="text-gray-600">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="TXN123456"
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Payment Date
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-4 top-3.5 text-amber-400" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-[#0B1120] border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Note <span className="text-gray-600">(Optional)</span>
              </label>
              <div className="relative">
                <FaStickyNote className="absolute left-4 top-3.5 text-amber-400" />
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note..."
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white py-3 rounded-xl font-bold text-lg transition shadow-lg shadow-orange-600/20 disabled:opacity-60"
            >
              {saving ? "Recording payment..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
