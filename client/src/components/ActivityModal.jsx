import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaTimes,
  FaSave,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUserAlt,
  FaStickyNote,
  FaEdit,
  FaPlus,
} from "react-icons/fa";

const STATUSES = ["Upcoming", "Ongoing", "Completed"];

const emptyForm = {
  title: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  startTime: "",
  endTime: "",
  location: "",
  organizer: "",
  status: "Upcoming",
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

export default function ActivityModal({ editingActivity, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingActivity) {
      setForm({
        title: editingActivity.title || "",
        description: editingActivity.description || "",
        date: editingActivity.date
          ? new Date(editingActivity.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        startTime: editingActivity.startTime || "",
        endTime: editingActivity.endTime || "",
        location: editingActivity.location || "",
        organizer: editingActivity.organizer || "",
        status: editingActivity.status || "Upcoming",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingActivity]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Activity title is required");
      return;
    }

    if (!form.date) {
      alert("Activity date is required");
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      console.error("❌ Activity save error:", err);
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
                {editingActivity ? (
                  <>
                    <FaEdit /> Edit Activity
                  </>
                ) : (
                  <>
                    <FaPlus /> Add Activity
                  </>
                )}
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
              Activity Title <span className="text-red-500">*</span>
            </label>
            <FieldWrapper icon={<FaEdit />}>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Ganapathi Prana Prathishta"
                className={inputClass}
                required
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
                placeholder="Optional description..."
                rows="3"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 pl-11 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
              />
            </FieldWrapper>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <FieldWrapper icon={<FaCalendarAlt />}>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Start Time
              </label>
              <FieldWrapper icon={<FaClock />}>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </FieldWrapper>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                End Time
              </label>
              <FieldWrapper icon={<FaClock />}>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </FieldWrapper>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Location
              </label>
              <FieldWrapper icon={<FaMapMarkerAlt />}>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Venue / location"
                  className={inputClass}
                />
              </FieldWrapper>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Organizer
              </label>
              <FieldWrapper icon={<FaUserAlt />}>
                <input
                  type="text"
                  name="organizer"
                  value={form.organizer}
                  onChange={handleChange}
                  placeholder="Organizer name"
                  className={inputClass}
                />
              </FieldWrapper>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
