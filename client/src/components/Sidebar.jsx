import { Link, useLocation } from "react-router-dom";
import {
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

// All navigation links
const navLinks = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: FaHome,
  },
  {
    to: "/payments",
    label: "Payments",
    icon: FaMoneyBill,
  },
  {
    to: "/sponsors",
    label: "Sponsors",
    icon: FaHandHoldingHeart,
  },
  {
    to: "/activities",
    label: "Activities",
    icon: FaCalendarAlt,
  },
  {
    to: "/expenses",
    label: "Expenses",
    icon: FaWallet,
  },
  {
    to: "/receipts",
    label: "Receipts",
    icon: FaReceipt,
  },
  {
    to: "/notifications",
    label: "Notifications",
    icon: FaBell,
  },
  {
    to: "/reports",
    label: "Reports",
    icon: FaChartBar,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: FaCog,
  },
];

export default function Sidebar() {
  const user = getCurrentUser();
  const location = useLocation();

  const isAdmin = user?.role === "Admin";

  // Members cannot access Reports and Settings
  const visibleLinks = isAdmin
    ? navLinks
    : navLinks.filter(
        (link) =>
          link.to !== "/reports" &&
          link.to !== "/settings"
      );

  return (
    <>
      {/* =====================================================
          DESKTOP SIDEBAR
          ===================================================== */}

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-[#111827] text-white border-r border-white/10 flex-col z-50">

        {/* Logo / Title */}
        <div className="px-5 py-6 border-b border-white/10">
          <h1 className="text-xl font-bold leading-tight text-amber-400">
            🕉️ Shree Vinayaka
          </h1>

          <p className="text-xs text-gray-400 mt-1">
            Ganapathi Utsav 2026
          </p>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-2">

          {visibleLinks.map((link) => {
            const Icon = link.icon;

            const active =
              location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? "bg-amber-400 text-black font-semibold"
                    : "text-gray-300 hover:bg-white/10 hover:text-amber-400"
                }`}
              >
                <Icon className="text-lg flex-shrink-0" />

                <span>
                  {link.label}
                </span>
              </Link>
            );
          })}

        </nav>
      </aside>


      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
          ===================================================== */}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111827]/95 backdrop-blur-xl border-t border-white/10">

        <div
          className="flex items-center gap-2 overflow-x-auto px-2 py-2"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >

          {visibleLinks.map((link) => {
            const Icon = link.icon;

            const active =
              location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
              className={`flex-shrink-0 min-w-[68px] px-2 py-2 rounded-xl text-center transition-all ${
                  active
                    ? "text-amber-400 bg-amber-400/10"
                    : "text-gray-400"
                }`}
              >

                <Icon className="text-xl mx-auto mb-1" />

                <span className="block text-[10px] whitespace-nowrap">
                  {link.label}
                </span>

              </Link>
            );
          })}

        </div>

      </nav>
    </>
  );
}
