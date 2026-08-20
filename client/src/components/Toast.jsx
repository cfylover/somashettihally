import { useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-[100] animate-slide-in">
      <div
        className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white font-semibold ${
          type === "success" ? "bg-green-600" : "bg-red-600"
        }`}
      >
        {type === "success" ? (
          <FaCheckCircle className="text-xl" />
        ) : (
          <FaExclamationCircle className="text-xl" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}
