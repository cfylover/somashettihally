import { useNavigate } from "react-router-dom";
import { FaBell, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { getCurrentUser, clearCurrentUser } from "../utils/auth";

export default function Navbar() {
  const today = new Date();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };

  return (
    <div className="bg-[#1b1b1b] min-h-20 px-4 py-3 sm:px-6 lg:px-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-yellow-500 shadow-lg">

      {/* Left */}

      <div>

        <h1 className="text-xl leading-tight sm:text-2xl lg:text-3xl font-bold text-yellow-400">
          🕉️ Shree Vinayaka Geleyara Balaga
        </h1>

        <p className="text-gray-400 text-xs sm:text-sm">
          Ganapathi Utsav Management System
        </p>

      </div>

      {/* Right */}

      <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-5 lg:gap-6">

        <div className="text-left text-sm sm:text-right">

          <p className="text-white">
            {today.toLocaleDateString()}
          </p>

          <p className="text-yellow-400">
            {today.toLocaleTimeString()}
          </p>

        </div>

        <FaBell
          className="text-yellow-400 text-xl sm:text-2xl cursor-pointer"
        />

        <div className="flex items-center gap-2">
          <FaUserCircle
            className="text-white text-3xl sm:text-4xl"
          />
          <div>
            <p className="text-white text-sm font-semibold">
              {user?.username || "Guest"}
            </p>
            <p className="text-yellow-400 text-xs">
              {user?.role || "Unknown"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-600 px-3 py-2 sm:px-4 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm sm:text-base"
        >
          <FaSignOutAlt />
          Logout
        </button>

      </div>

    </div>
  );
}
