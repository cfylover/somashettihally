import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUserAlt,
  FaCalendarCheck,
  FaCalendarDay,
  FaCheckCircle,
  FaClipboardList,
  FaTimes,
  FaStickyNote,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import {
  getActivities,
  addActivity,
  updateActivity,
  deleteActivity,
} from "../api/activityApi";
import ActivityModal from "../components/ActivityModal";
import Toast from "../components/Toast";
import { getCurrentUser } from "../utils/auth";
import MobileNav from "../components/MobileNav";

const STATUS_BADGE = {
  Upcoming: "bg-blue-100 text-blue-700",
  Ongoing: "bg-orange-100 text-orange-700",
  Completed: "bg-green-100 text-green-700",
};

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (t) => {
  if (!t) return "-";
  const [h, m] = t.split(":");
  if (!h) return t;
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m || "00"} ${suffix}`;
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

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Activities() {
  const user = getCurrentUser();
  const isAdminUser = user?.role === "Admin";

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const [toast, setToast] = useState(null);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    fetchActivities();
  }, []);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const data = await getActivities();
      setActivities(data);
    } catch (err) {
      console.error("❌ Error fetching activities:", err);
      showToast("Failed to load activities", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...activities];

    if (filter === "Upcoming") {
      list = list.filter((a) => a.status === "Upcoming");
    } else if (filter === "Completed") {
      list = list.filter((a) => a.status === "Completed");
    } else if (filter === "Today") {
      list = list.filter((a) => isToday(a.date));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          (a.title || "").toLowerCase().includes(q) ||
          (a.organizer || "").toLowerCase().includes(q) ||
          (a.location || "").toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  }, [activities, search, filter]);

  const summary = useMemo(() => {
    const upcoming = activities.filter((a) => a.status === "Upcoming").length;
    const today = activities.filter((a) => isToday(a.date)).length;
    const completed = activities.filter((a) => a.status === "Completed").length;
    return { upcoming, today, completed, total: activities.length };
  }, [activities]);

  const cards = [
    { title: "Upcoming Events", value: summary.upcoming, icon: <FaCalendarCheck />, bg: "bg-blue-100", text: "text-blue-600" },
    { title: "Today's Events", value: summary.today, icon: <FaCalendarDay />, bg: "bg-orange-100", text: "text-orange-600" },
    { title: "Completed Events", value: summary.completed, icon: <FaCheckCircle />, bg: "bg-green-100", text: "text-green-600" },
    { title: "Total Activities", value: summary.total, icon: <FaClipboardList />, bg: "bg-purple-100", text: "text-purple-600" },
  ];

  // ─── Calendar helpers ─────────────────────────────────────────────
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const activityDates = useMemo(() => {
    const map = {};
    activities.forEach((a) => {
      if (!a.date) return;
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [activities]);

  const goPrevMonth = () =>
    setCalendarDate(new Date(year, month - 1, 1));
  const goNextMonth = () =>
    setCalendarDate(new Date(year, month + 1, 1));

  const handleAddClick = () => {
    setEditingActivity(null);
    setShowModal(true);
  };

  const handleEditClick = (activity) => {
    setEditingActivity(activity);
    setShowModal(true);
  };

  const handleSave = async (form) => {
    try {
      if (editingActivity) {
        await updateActivity(editingActivity._id, form);
        showToast("Activity updated successfully");
      } else {
        await addActivity(form);
        showToast("Activity added successfully");
      }
      await fetchActivities();
    } catch (err) {
      console.error("❌ Save error:", err);
      showToast(err.response?.data?.message || "Failed to save activity", "error");
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteActivity(deleteTarget._id);
      showToast("Activity deleted successfully");
      await fetchActivities();
    } catch (err) {
      console.error("❌ Delete error:", err);
      showToast("Failed to delete activity", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-200 p-4 md:p-8 pt-16 lg:pt-8">
      <MobileNav />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-700 flex flex-wrap items-center gap-3 leading-tight">
              <FaCalendarAlt /> Activities
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
              <FaPlus /> Add Activity
            </motion.button>
          )}
        </div>

        {/* Top Cards */}
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

        {/* Calendar View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
              <FaCalendarAlt className="text-orange-500" /> Calendar View
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={goPrevMonth}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 flex items-center justify-center transition"
              >
                <FaChevronLeft />
              </button>
              <span className="font-bold text-gray-700 min-w-[150px] text-center">
                {MONTHS[month]} {year}
              </span>
              <button
                onClick={goNextMonth}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 flex items-center justify-center transition"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DOW.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-500 py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 md:h-24" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const key = `${year}-${month + 1}-${day}`;
              const dayActivities = activityDates[key] || [];
              const isCurrentDay =
                isToday(new Date(year, month, day));
              return (
                <div
                  key={day}
                  className={`h-20 md:h-24 rounded-xl border p-1.5 overflow-hidden transition ${
                    isCurrentDay
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-100 hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-bold ${
                        isCurrentDay ? "text-orange-600" : "text-gray-600"
                      }`}
                    >
                      {day}
                    </span>
                    {dayActivities.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayActivities.slice(0, 2).map((a) => (
                      <button
                        key={a._id}
                        onClick={() => setViewTarget(a)}
                        className="block w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 font-semibold truncate hover:from-orange-200 hover:to-yellow-200"
                      >
                        {a.title}
                      </button>
                    ))}
                    {dayActivities.length > 2 && (
                      <p className="text-[10px] text-gray-400 pl-1">
                        +{dayActivities.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-orange-500">
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, organizer, location..."
                className="w-full outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-700">
                  <FaTimes />
                </button>
              )}
            </div>
            <div className="flex gap-2 md:col-span-2">
              {["All", "Upcoming", "Today", "Completed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 px-3 py-2 rounded-xl font-semibold text-sm transition ${
                    filter === f
                      ? "bg-gradient-to-r from-orange-600 to-yellow-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-orange-100"
                  }`}
                >
                  {f === "Today" ? "Today's Events" : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Event List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <FaClipboardList className="text-orange-500" /> Event List ({filtered.length})
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-3xl shadow-xl">
              <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl text-center py-20">
              <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {search || filter !== "All" ? "No activities match your filters" : "No Activities Found"}
              </p>
              <p className="text-gray-400 mt-1">
                {search || filter !== "All" ? "Try different search or filters" : "Click 'Add Activity' to get started"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((activity, i) => (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
                >
                  <div className="bg-gradient-to-r from-orange-600 to-yellow-500 p-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">
                        {activity.title}
                      </h3>
                      <p className="text-orange-100 text-xs mt-1">
                        {formatDate(activity.date)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[activity.status] || STATUS_BADGE.Upcoming}`}
                    >
                      {activity.status}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <FaClock className="text-orange-500" />
                        <span>
                          {formatTime(activity.startTime)}
                          {activity.endTime ? ` - ${formatTime(activity.endTime)}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm truncate">
                        <FaMapMarkerAlt className="text-orange-500" />
                        <span className="truncate">{activity.location || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm col-span-2">
                        <FaUserAlt className="text-orange-500" />
                        <span>Organizer: {activity.organizer || "-"}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex items-center gap-2">
                      <button
                        onClick={() => setViewTarget(activity)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 transition"
                      >
                        <FaEye /> Details
                      </button>
                      {isAdminUser && (
                        <>
                          <button
                            onClick={() => handleEditClick(activity)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 transition"
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(activity)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 transition"
                          >
                            <FaTrash /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <ActivityModal
          editingActivity={editingActivity}
          onClose={() => { setShowModal(false); setEditingActivity(null); }}
          onSave={handleSave}
        />
      )}

      {/* View Details Modal */}
      {viewTarget && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-600 to-yellow-500 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaCalendarAlt /> Activity Details
              </h2>
              <button
                onClick={() => setViewTarget(null)}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-4 rounded-full bg-orange-100">
                  <FaCalendarAlt className="text-orange-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{viewTarget.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[viewTarget.status] || STATUS_BADGE.Upcoming}`}>
                    {viewTarget.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FaCalendarAlt className="text-orange-500" /> Date
                  </p>
                  <p className="font-semibold mt-1">{formatDate(viewTarget.date)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FaClock className="text-orange-500" /> Time
                  </p>
                  <p className="font-semibold mt-1">
                    {formatTime(viewTarget.startTime)}
                    {viewTarget.endTime ? ` - ${formatTime(viewTarget.endTime)}` : ""}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FaMapMarkerAlt className="text-orange-500" /> Location
                  </p>
                  <p className="font-semibold mt-1">{viewTarget.location || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FaUserAlt className="text-orange-500" /> Organizer
                  </p>
                  <p className="font-semibold mt-1">{viewTarget.organizer || "-"}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <FaStickyNote className="text-orange-500" /> Description
                </p>
                <p className="font-semibold mt-1">{viewTarget.description || "-"}</p>
              </div>

              <button
                onClick={() => setViewTarget(null)}
                className="w-full bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-700 hover:to-yellow-600 text-white py-3 rounded-xl font-bold transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
            <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FaTrash className="text-red-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Activity?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget.title}</span>? This action cannot be
              undone.
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
