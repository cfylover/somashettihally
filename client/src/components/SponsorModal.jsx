import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaTimes,
  FaSave,
  FaUserAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaReceipt,
  FaStickyNote,
  FaMoneyBillWave,
  FaHandHoldingHeart,
} from "react-icons/fa";

const emptyForm = {
  sponsorName: "",
  phone: "",
  address: "",
  amount: "",
  paymentMethod: "Cash",
  receiptNumber: "",
  notes: "",
};

// Defined at module scope so it is NOT recreated on every render.
// (A component defined inside another component is treated as a new
//  type on each render, causing React to remount the input subtree and
//  drop focus on every keystroke.)
const FieldWrapper = ({ icon, children }) => (
  <div className="relative">
    <span className="absolute left-4 top-3.5 text-orange-500 text-lg">{icon}</span>
    {children}
  </div>
);

export default function SponsorModal({ editingSponsor, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingSponsor) {
      setForm({
        sponsorName: editingSponsor.sponsorName || "",
        phone: editingSponsor.phone || "",
        address: editingSponsor.address || "",
        amount: editingSponsor.amount ?? "",
        paymentMethod: editingSponsor.paymentMethod || "Cash",
        receiptNumber: editingSponsor.receiptNumber || "",
        notes: editingSponsor.notes || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingSponsor]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.sponsorName.trim() || !form.phone.trim()) {
      alert("Sponsor name and phone are required");
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      console.error("❌ Sponsor save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 pl-11 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800";

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl my-8"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-yellow-500 p-6 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaHandHoldingHeart />
                {editingSponsor ? "Edit Sponsor" : "Add Sponsor"}
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                Shree Vinayaka Geleyara Balaga - Ganapathi Utsav 2026
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">
              Sponsor Name <span className="text-red-500">*</span>
            </label>
            <FieldWrapper icon={<FaUserAlt />}>
              <input
                type="text"
                name="sponsorName"
                value={form.sponsorName}
                onChange={handleChange}
                placeholder="Enter sponsor name"
                className={inputClass}
                required
              />
            </FieldWrapper>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">
              Phone <span className="text-red-500">*</span>
            </label>
            <FieldWrapper icon={<FaPhone />}>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className={inputClass}
                required
              />
            </FieldWrapper>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">
              Address
            </label>
            <FieldWrapper icon={<FaMapMarkerAlt />}>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter address"
                className={inputClass}
              />
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Amount (₹)
              </label>
              <FieldWrapper icon={<FaRupeeSign />}>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={inputClass}
                />
              </FieldWrapper>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Receipt Number
              </label>
              <FieldWrapper icon={<FaReceipt />}>
                <input
                  type="text"
                  name="receiptNumber"
                  value={form.receiptNumber}
                  onChange={handleChange}
                  placeholder="e.g. RCP-001"
                  className={inputClass}
                />
              </FieldWrapper>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Mode (Info)
              </label>
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-orange-600 text-sm">
                <FaMoneyBillWave />
                <span>
                  Status: {editingSponsor?.status || (Number(form.amount) > 0 ? "Paid" : "Pending")}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">
              Notes
            </label>
            <FieldWrapper icon={<FaStickyNote />}>
              <input
                type="text"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes..."
                className={inputClass}
              />
            </FieldWrapper>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-700 hover:to-yellow-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <FaSave />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
