import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUsers,
  FaHandHoldingHeart,
  FaRupeeSign,
  FaEye,
  FaPhone,
  FaMapMarkerAlt,
  FaReceipt,
  FaCalendarAlt,
  FaTimes,
  FaUserAlt,
  FaStickyNote,
} from "react-icons/fa";
import { getSponsors, addSponsor, updateSponsor, deleteSponsorApi } from "../api/sponsorApi";
import SponsorModal from "../components/SponsorModal";
import Toast from "../components/Toast";
import { getCurrentUser } from "../utils/auth";
import MobileNav from "../components/MobileNav";

export default function Sponsors() {
  const user = getCurrentUser();
  const isAdminUser = user?.role === "Admin";

  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [viewingSponsor, setViewingSponsor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSponsors();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const fetchSponsors = async () => {
    setLoading(true);
    try {
      const data = await getSponsors();
      setSponsors(data);
    } catch (err) {
      console.error("❌ Error fetching sponsors:", err);
      showToast("Failed to load sponsors", "error");
    } finally {
      setLoading(false);
    }
  };

  // Search filter
  const filteredSponsors = useMemo(() => {
    if (!search.trim()) return sponsors;
    const q = search.toLowerCase();
    return sponsors.filter(
      (s) =>
        s.sponsorName.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.receiptNumber.toLowerCase().includes(q) ||
        s.paymentMethod.toLowerCase().includes(q)
    );
  }, [sponsors, search]);

  // Summary
  const summary = useMemo(() => {
    const totalSponsors = sponsors.length;
    const totalAmount = sponsors.reduce(
      (sum, s) => sum + (Number(s.amount) || 0),
      0
    );
    const paid = sponsors.filter((s) => s.status === "Paid").length;
    const pending = sponsors.filter((s) => s.status === "Pending").length;
    return { totalSponsors, totalAmount, paid, pending };
  }, [sponsors]);

  const handleAddClick = () => {
    setEditingSponsor(null);
    setShowModal(true);
  };

  const handleEditClick = (sponsor) => {
    setEditingSponsor(sponsor);
    setShowModal(true);
  };

  const handleSave = async (form) => {
    try {
      if (editingSponsor) {
        await updateSponsor(editingSponsor._id, form);
        showToast("Sponsor updated successfully");
      } else {
        await addSponsor(form);
        showToast("Sponsor added successfully");
      }
      await fetchSponsors();
    } catch (err) {
      console.error("❌ Save error:", err);
      showToast(err.response?.data?.message || "Failed to save sponsor", "error");
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSponsorApi(deleteTarget._id);
      showToast("Sponsor deleted successfully");
      await fetchSponsors();
    } catch (err) {
      console.error("❌ Delete error:", err);
      showToast("Failed to delete sponsor", "error");
    } finally {
      setDeleteTarget(null);
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

  const methodBadge = (method) => {
    if (method === "Cash") return "bg-green-100 text-green-700";
    if (method === "UPI") return "bg-blue-100 text-blue-700";
    return "bg-purple-100 text-purple-700";
  };

  const cards = [
    {
      title: "Total Sponsors",
      value: summary.totalSponsors,
      icon: <FaUsers />,
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-100",
      text: "text-blue-600",
    },
    {
      title: "Total Sponsor Amount",
      value: `₹${summary.totalAmount.toLocaleString("en-IN")}`,
      icon: <FaHandHoldingHeart />,
      color: "from-green-500 to-emerald-500",
      bg: "bg-green-100",
      text: "text-green-600",
    },
    {
      title: "Paid",
      value: summary.paid,
      icon: <FaRupeeSign />,
      color: "from-orange-500 to-yellow-500",
      bg: "bg-orange-100",
      text: "text-orange-600",
    },
    {
      title: "Pending",
      value: summary.pending,
      icon: <FaUsers />,
      color: "from-red-500 to-rose-500",
      bg: "bg-red-100",
      text: "text-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-200 p-4 md:p-8 pt-16 lg:pt-8">
      <MobileNav />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-700 flex flex-wrap items-center gap-3 leading-tight">
              <FaHandHoldingHeart />
              Sponsors
            </h1>
            <p className="text-gray-600 mt-1">
              Shree Vinayaka Geleyara Balaga - Ganapathi Utsav 2026
            </p>
          </div>

          {isAdminUser && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddClick}
              className="bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-700 hover:to-yellow-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition"
            >
              <FaPlus />
              Add Sponsor
            </motion.button>
          )}
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
                <p className={`text-3xl font-bold ${card.text}`}>
                  {card.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-orange-500">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sponsor by name, phone, receipt no..."
              className="w-full outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Sponsors Table */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredSponsors.length === 0 ? (
            <div className="text-center py-20">
              <FaHandHoldingHeart className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {search ? "No sponsors match your search" : "No Sponsors Found"}
              </p>
              <p className="text-gray-400 mt-1">
                {search ? "Try a different search" : "Click 'Add Sponsor' to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-600 to-yellow-500 text-white">
                  <tr>
                    <th className="p-4">S.No</th>
                    <th className="text-left p-4">Sponsor Name</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Receipt No</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSponsors.map((sponsor, index) => (
                    <tr
                      key={sponsor._id}
                      className="text-center border-b hover:bg-orange-50 transition"
                    >
                      <td className="p-4 font-semibold text-gray-500">{index + 1}</td>
                      <td className="p-4 text-left font-semibold">
                        <span className="flex items-center gap-2">
                          <span className="bg-orange-100 text-orange-700 p-2 rounded-full">
                            <FaUserAlt className="text-xs" />
                          </span>
                          {sponsor.sponsorName}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        <span className="flex items-center justify-center gap-1">
                          <FaPhone className="text-gray-400 text-xs" />
                          {sponsor.phone}
                        </span>
                      </td>
                      <td className="p-4 text-green-700 font-bold">
                        <span className="flex items-center justify-center gap-1">
                          <FaRupeeSign className="text-xs" />
                          {Number(sponsor.amount).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${methodBadge(sponsor.paymentMethod)}`}>
                          {sponsor.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{sponsor.receiptNumber || "-"}</td>
                      <td className="p-4 text-gray-600">{formatDate(sponsor.date)}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-white text-xs font-bold ${
                            sponsor.status === "Paid" ? "bg-green-600" : "bg-red-500"
                          }`}
                        >
                          {sponsor.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingSponsor(sponsor)}
                            title="View"
                            className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition"
                          >
                            <FaEye />
                          </button>
                          {isAdminUser && (
                            <>
                              <button
                                onClick={() => handleEditClick(sponsor)}
                                title="Edit"
                                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(sponsor)}
                                title="Delete"
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
                              >
                                <FaTrash />
                              </button>
                            </>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <SponsorModal
          editingSponsor={editingSponsor}
          onClose={() => {
            setShowModal(false);
            setEditingSponsor(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* View Details Popup */}
      {viewingSponsor && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-600 to-yellow-500 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaHandHoldingHeart /> Sponsor Details
              </h2>
              <button
                onClick={() => setViewingSponsor(null)}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 text-orange-700 p-4 rounded-full">
                  <FaUserAlt className="text-xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {viewingSponsor.sponsorName}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-white text-xs font-bold ${
                      viewingSponsor.status === "Paid" ? "bg-green-600" : "bg-red-500"
                    }`}
                  >
                    {viewingSponsor.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FaPhone className="text-orange-500" /> Phone
                  </p>
                  <p className="font-semibold mt-1">{viewingSponsor.phone}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FaRupeeSign className="text-orange-500" /> Amount
                  </p>
                  <p className="font-semibold mt-1 text-green-600">
                    ₹{Number(viewingSponsor.amount).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FaMapMarkerAlt className="text-orange-500" /> Address
                  </p>
                  <p className="font-semibold mt-1">{viewingSponsor.address || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FaReceipt className="text-orange-500" /> Receipt No
                  </p>
                  <p className="font-semibold mt-1">{viewingSponsor.receiptNumber || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FaCalendarAlt className="text-orange-500" /> Date
                  </p>
                  <p className="font-semibold mt-1">{formatDate(viewingSponsor.date)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FaHandHoldingHeart className="text-orange-500" /> Payment Method
                  </p>
                  <p className="font-semibold mt-1">{viewingSponsor.paymentMethod}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <FaStickyNote className="text-orange-500" /> Notes
                </p>
                <p className="font-semibold mt-1">{viewingSponsor.notes || "-"}</p>
              </div>

              <button
                onClick={() => setViewingSponsor(null)}
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
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Sponsor?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget.sponsorName}</span>? This action
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
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
