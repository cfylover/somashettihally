import { FaSave, FaBuilding, FaLanguage, FaUniversity } from "react-icons/fa";
import MobileNav from "../components/MobileNav";

export default function Settings() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 pb-24 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      <MobileNav />

      <h1 className="text-4xl font-bold text-yellow-400 mb-8">
        ⚙️ Settings
      </h1>

      <div className="grid lg:grid-cols-2 gap-8">

        {/* Organization Details */}

        <div className="bg-[#1b1b1b] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">

          <h2 className="text-2xl text-yellow-400 mb-6 flex items-center gap-3">
            <FaBuilding />
            Organization
          </h2>

          <input
            className="w-full p-3 rounded-xl bg-[#2a2a2a] mb-4"
            placeholder="Organization Name"
            defaultValue="Shree Vinayaka Geleyara Balaga"
          />

          <input
            className="w-full p-3 rounded-xl bg-[#2a2a2a] mb-4"
            placeholder="Festival"
            defaultValue="Ganapathi Utsav 2026"
          />

          <textarea
            className="w-full p-3 rounded-xl bg-[#2a2a2a]"
            rows="4"
            placeholder="Address"
          ></textarea>

        </div>

        {/* Bank Details */}

        <div className="bg-[#1b1b1b] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">

          <h2 className="text-2xl text-yellow-400 mb-6 flex items-center gap-3">
            <FaUniversity />
            Bank Details
          </h2>

          <input
            className="w-full p-3 rounded-xl bg-[#2a2a2a] mb-4"
            placeholder="Bank Name"
          />

          <input
            className="w-full p-3 rounded-xl bg-[#2a2a2a] mb-4"
            placeholder="Account Number"
          />

          <input
            className="w-full p-3 rounded-xl bg-[#2a2a2a] mb-4"
            placeholder="IFSC Code"
          />

          <input
            className="w-full p-3 rounded-xl bg-[#2a2a2a]"
            placeholder="UPI ID"
          />

        </div>

      </div>

      {/* Language */}

      <div className="bg-[#1b1b1b] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mt-8">

        <h2 className="text-2xl text-yellow-400 mb-6 flex items-center gap-3">
          <FaLanguage />
          Language
        </h2>

        <select className="bg-[#2a2a2a] p-3 rounded-xl w-64">
          <option>English</option>
          <option>ಕನ್ನಡ</option>
        </select>

      </div>

      <button className="mt-8 bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold flex items-center gap-3">

        <FaSave />

        Save Settings

      </button>

    </div>
  );
}