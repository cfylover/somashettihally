import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaTimes,
  FaSave,
  FaTag,
  FaRupeeSign,
  FaUserAlt,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaStickyNote,
} from "react-icons/fa";

const CATEGORIES = [
  "Decoration",
  "Sound",
  "Food",
  "Lighting",
  "Flowers",
  "Security",
  "Transportation",
  "Others",
];

const PAYMENT_METHODS = ["Cash", "UPI", "Bank"];

const emptyForm = {
  category: "Decoration",
  title: "",
  amount: "",
  paidTo: "",
  paymentMethod: "Cash",
  date: new Date().toISOString().split("T")[0],
  description: "",
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

export default function ExpenseModal({ editingExpense, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [customCategory, setCustomCategory] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      const cat = editingExpense.category || "Decoration";
      const isCustom = !CATEGORIES.includes(cat);
      setForm({
        category: isCustom ? "Others" : cat,
        title: editingExpense.title || "",
        amount: editingExpense.amount ?? "",
        paidTo: editingExpense.paidTo || "",
        paymentMethod: editingExpense.paymentMethod || "Cash",
        date: editingExpense.date
          ? new Date(editingExpense.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        description: editingExpense.description || "",
      });
      setCustomCategory(isCustom ? cat : "");
    } else {
      setForm(emptyForm);
      setCustomCategory("");
    }
  }, [editingExpense]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Expense title is required");
      return;
    }

    if (!form.amount || Number(form.amount) < 0) {
      alert("Please enter a valid amount");
      return;
    }

    const finalCategory = form.category === "Others" && customCategory.trim()
      ? customCategory.trim()
      : form.category;

    setSaving(true);
    try {
      await onSave({ ...form, category: finalCategory });
      onClose();
    } catch (err) {
      console.error("❌ Expense save error:", err);
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
                <FaFileInvoiceDollar />
                {editingExpense ? "Edit Expense" : "Add Expense"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {form.category === "Others" && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category..."
                  className="mt-2 w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                />
              )}
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
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">
              Expense Title <span className="text-red-500">*</span>
            </label>
            <FieldWrapper icon={<FaTag />}>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Stage Decoration Materials"
                className={inputClass}
                required
              />
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Amount (₹) <span className="text-red-500">*</span>
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
                  required
                />
              </FieldWrapper>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Paid To
              </label>
              <FieldWrapper icon={<FaUserAlt />}>
                <input
                  type="text"
                  name="paidTo"
                  value={form.paidTo}
                  onChange={handleChange}
                  placeholder="Vendor / person name"
                  className={inputClass}
                />
              </FieldWrapper>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">
              Expense Date
            </label>
            <FieldWrapper icon={<FaCalendarAlt />}>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className={inputClass}
              />
            </FieldWrapper>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">
              Description
            </label>
            <FieldWrapper icon={<FaStickyNote />}>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional notes / description..."
                rows="3"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 pl-11 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
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
