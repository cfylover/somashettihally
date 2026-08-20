import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaMoneyBill,
  FaHandHoldingHeart,
  FaCalendarAlt,
  FaChartBar,
  FaCog,
  FaReceipt,
  FaBell,
  FaWallet,
} from "react-icons/fa";
import { getCurrentUser } from "../utils/auth";

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: FaHome },
  { to: "/payments", label: "Payments", icon: FaMoneyBill },
  { to: "/sponsors", label: "Sponsors", icon: FaHandHoldingHeart },
  { to: "/activities", label: "Activities", icon: FaCalendarAlt },
  { to: "/expenses", label: "Expenses", icon: FaWallet },
  { to: "/receipts", label: "Receipts", icon: FaReceipt },
  { to: "/notifications", label: "Notifications", icon: FaBell },
  { to: "/reports", label: "Reports", icon: FaChartBar },
  { to: "/settings", label: "Settings", icon: FaCog },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const user = getCurrentUser();
  const isAdmin = user?.role === "Admin";

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const visibleLinks = isAdmin
    ? navLinks
    : navLinks.filter((l) => l.to !== "/reports" && l.to !== "/settings");

  return (
    <>
      {/* ─── Hamburger Button ─── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-[60] lg:hidden w-11 h-11 rounded-xl bg-[#111827] border border-white/10 flex items-center justify-center text-white shadow-xl hover:bg-white/10 transition"
      >
        <FaBars className="text-lg" />
      </button>

      {/* ─── Backdrop ─── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* ─── Slide-out Drawer ─── */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-[70] w-72 bg-[#111827] border-r border-white/10 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-amber-400 leading-tight">
              🕉️ Shree Vinayaka
            </h1>
            <p className="text-[10px] text-gray-400">Ganapathi Utsav 2026</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-amber-400 text-black font-semibold"
                    : "text-gray-300 hover:bg-white/10 hover:text-amber-400"
                }`}
              >
                <Icon className="text-lg flex-shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 p-3">
            <p className="text-amber-300 font-bold text-xs">🙏 Jai Ganesha</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Ganapathi Bappa Morya</p>
          </div>
        </div>
      </div>
    </>
  );
}
