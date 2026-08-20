import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaBell,
  FaBullhorn,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaTimes,
  FaStickyNote,
  FaCheckCircle,
  FaExclamationCircle,
  FaRegBell,
} from "react-icons/fa";
import {
  getNotifications,
  addNotification,
  updateNotification,
  deleteNotification,
} from "../api/notificationApi";
import NotificationModal from "../components/NotificationModal";
import Toast from "../components/Toast";
import { getCurrentUser } from "../utils/auth";
import MobileNav from "../components/MobileNav";

const TYPES = ["General", "Payment Reminder", "Event", "Emergency"];

const TYPE_BADGE = {
  General: "bg-blue-100 text-blue-700",
  "Payment Reminder": "bg-green-100 text-green-700",
  Event: "bg-purple-100 text-purple-700",
  Emergency: "bg-red-100 text-red-700",
};

const TYPE_ICON = {
  General: <FaBullhorn />,
  "Payment Reminder": <FaCheckCircle />,
  Event: <FaCalendarAlt />,
  Emergency: <FaExclamationCircle />,
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

export default function Notifications() {
  const user = getCurrentUser();
  const isAdminUser = user?.role === "Admin";

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
      showToast("Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...notifications];

    if (typeFilter) list = list.filter((n) => n.type === typeFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          (n.title || "").toLowerCase().includes(q) ||
          (n.message || "").toLowerCase().includes(q) ||
          (n.targetAudience || "").toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [notifications, search, typeFilter]);

  const summary = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.read).length;
    const today = notifications.filter((n) => isToday(n.date)).length;
    const scheduled = notifications.filter((n) => {
      if (!n.date) return false;
      return new Date(n.date) > new Date();
    }).length;
    return { total, unread, today, scheduled };
  }, [notifications]);

  const cards = [
    { title: "Total Notifications", value: summary.total, icon: <FaBell />, bg: "bg-blue-100", text: "text-blue-600" },
    { title: "Unread", value: summary.unread, icon: <FaRegBell />, bg: "bg-red-100", text: "text-red-600" },
    { title: "Today's Notifications", value: summary.today, icon: <FaCalendarAlt />, bg: "bg-orange-100", text: "text-orange-600" },
    { title: "Scheduled", value: summary.scheduled, icon: <FaClock />, bg: "bg-purple-100", text: "text-purple-600" },
  ];

  const handleAddClick = () => {
    setEditingNotification(null);
    setShowModal(true);
  };

  const handleEditClick = (notification) => {
    setEditingNotification(notification);
    setShowModal(true);
  };

  const handleSave = async (form) => {
    try {
      if (editingNotification) {
        await updateNotification(editingNotification._id, form);
        showToast("Notification updated successfully");
      } else {
        await addNotification(form);
        showToast("Notification added successfully");
      }
      await fetchNotifications();
    } catch (err) {
      console.error("❌ Save error:", err);
      showToast(err.response?.data?.message || "Failed to save notification", "error");
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteNotification(deleteTarget._id);
      showToast("Notification deleted successfully");
      await fetchNotifications();
    } catch (err) {
      console.error("❌ Delete error:", err);
      showToast("Failed to delete notification", "error");
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
              <FaBell /> Notifications
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
              <FaPlus /> Add Notification
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

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-orange-500">
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, message, audience..."
                className="w-full outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-700">
                  <FaTimes />
                </button>
              )}
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              onClick={() => { setSearch(""); setTypeFilter(""); }}
              className="bg-gray-100 hover:bg-orange-100 text-gray-700 rounded-xl px-4 py-3 font-semibold transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <FaBullhorn className="text-orange-500" /> Notification List ({filtered.length})
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-3xl shadow-xl">
              <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl text-center py-20">
              <FaBell className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {search || typeFilter ? "No notifications match your filters" : "No Notifications Found"}
              </p>
              <p className="text-gray-400 mt-1">
                {search || typeFilter ? "Try different search or filters" : "Click 'Add Notification' to get started"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((notification, i) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5 }}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden border ${
                    notification.read ? "border-gray-100" : "border-orange-300"
                  }`}
                >
                  <div className="bg-gradient-to-r from-orange-600 to-yellow-500 p-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight flex items-center gap-2">
                        {TYPE_ICON[notification.type] || <FaBullhorn />} {notification.title}
                      </h3>
                      <p className="text-orange-100 text-xs mt-1">
                        {formatDate(notification.date)}
                        {notification.time ? ` · ${formatTime(notification.time)}` : ""}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${TYPE_BADGE[notification.type] || TYPE_BADGE.General}`}
                    >
                      {notification.type}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {notification.message || "-"}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center gap-1.5">
                        <FaUsers /> {notification.targetAudience || "All Members"}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center gap-1.5">
                        <FaClock /> {formatTime(notification.time)}
                      </span>
                      {!notification.read && (
                        <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                          New
                        </span>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex items-center gap-2">
                      <button
                        onClick={() => setViewTarget(notification)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 transition"
                      >
                        <FaEye /> View
                      </button>
                      {isAdminUser && (
                        <>
                          <button
                            onClick={() => handleEditClick(notification)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 transition"
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(notification)}
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
        <NotificationModal
          editingNotification={editingNotification}
          onClose={() => { setShowModal(false); setEditingNotification(null); }}
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
                <FaBell /> Notification Details
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
                  <FaBell className="text-orange-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{viewTarget.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${TYPE_BADGE[viewTarget.type] || TYPE_BADGE.General}`}>
                    {viewTarget.type}
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
                  <p className="font-semibold mt-1">{formatTime(viewTarget.time)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FaUsers className="text-orange-500" /> Target Audience
                  </p>
                  <p className="font-semibold mt-1">{viewTarget.targetAudience || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FaBullhorn className="text-orange-500" /> Status
                  </p>
                  <p className="font-semibold mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${viewTarget.read ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {viewTarget.read ? "Read" : "Unread"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <FaStickyNote className="text-orange-500" /> Message
                </p>
                <p className="font-semibold mt-1">{viewTarget.message || "-"}</p>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Notification?</h2>
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
