import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserAlt, FaLock } from "react-icons/fa";
import { loginUser } from "../api/authApi";
import { setCurrentUser } from "../utils/auth";
import ganapathi from "../assets/images/logo.png";
import ganapathi_background from "../assets/images/IMG_20250827_214416.jpg";

export default function Login() {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username || !form.password) {
      setError("Please enter username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(form.username, form.password);

      console.log("✅ Login response:", data);

      // Save user in localStorage (as required)
      localStorage.setItem("token", data.token);
      setCurrentUser(data.user);

      console.log("✅ Logged in as:", data.user.role);

      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Login error:", err.response);
      console.error("❌ Error data:", err.response?.data);
      console.error("❌ Error message:", err.message);
      setError(err.response?.data?.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center overflow-x-hidden overflow-y-auto px-4 py-10 sm:px-6"
      style={{
        backgroundImage: `url(${ganapathi_background})`,
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"></div>

      {/* Floating Glow */}
      <div className="absolute h-[60vw] max-h-[600px] min-h-[260px] w-[60vw] min-w-[260px] max-w-[600px] rounded-full bg-yellow-400/20 blur-[120px] sm:blur-[180px]"></div>

      {/* Login Card */}
      <div className="relative z-10 mt-14 w-full max-w-[430px] rounded-3xl bg-gradient-to-b from-[#5a3a18]/70 to-[#2c1b0b]/80 backdrop-blur-xl border border-yellow-500/50 shadow-[0_0_50px_rgba(255,191,0,0.4)] px-5 py-7 sm:px-8 sm:py-10">

        {/* Logo */}
        <div className="flex justify-center -mt-20 mb-4 sm:-mt-28">
          <div className="relative">

            {/* Glow Ring */}
            <div className="absolute -inset-3 rounded-full bg-yellow-400 blur-2xl opacity-60 animate-pulse"></div>

            <img
              src={ganapathi}
              alt="Ganapathi"
              className="relative h-32 w-32 rounded-full border-[5px] border-yellow-400 object-cover shadow-[0_0_40px_rgba(255,215,0,0.9)] sm:h-44 sm:w-44 sm:border-[7px]"
            />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-center font-serif text-3xl font-bold leading-tight text-yellow-200 sm:text-4xl">
          Shree Vinayaka Geleyara Balaga
        </h1>

        <div className="flex justify-center mt-3">
          <div className="w-32 h-[2px] bg-yellow-400"></div>
        </div>

        <p className="text-center text-yellow-100 text-lg sm:text-xl mt-4">
          Ganapathi Utsav 2026
        </p>

        <form onSubmit={handleSubmit}>

          {/* Username */}
          <div className="mt-8 relative">
            <FaUserAlt className="absolute left-5 top-4 text-yellow-400" />

            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className="w-full bg-black/20 border border-yellow-500/40 rounded-xl py-3 pl-14 pr-4 text-white placeholder:text-gray-300 outline-none focus:border-yellow-300 focus:shadow-[0_0_20px_rgba(255,215,0,0.6)] transition"
            />
          </div>

          {/* Password */}
          <div className="mt-5 relative">
            <FaLock className="absolute left-5 top-4 text-yellow-400" />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-black/20 border border-yellow-500/40 rounded-xl py-3 pl-14 pr-4 text-white placeholder:text-gray-300 outline-none focus:border-yellow-300 focus:shadow-[0_0_20px_rgba(255,215,0,0.6)] transition"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl p-3 text-center">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 py-3.5 text-xl font-bold text-black shadow-[0_0_30px_rgba(255,215,0,0.6)] duration-300 hover:scale-[1.02] hover:shadow-[0_0_45px_rgba(255,215,0,1)] disabled:opacity-60 sm:py-4 sm:text-2xl"
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>

        </form>

        {/* Bottom */}
        <div className="mt-8 text-center">

          <div className="text-4xl text-yellow-400">
            🕉
          </div>

          <p className="mt-2 text-yellow-200 text-lg">
            ॥ Vakratunda Mahakaya ॥
          </p>

        </div>

      </div>

      {/* Bottom Lamps */}
      <div className="absolute bottom-5 left-4 text-4xl animate-pulse sm:left-8 sm:text-6xl">
        🪔
      </div>

      <div className="absolute bottom-5 right-4 text-4xl animate-pulse sm:right-8 sm:text-6xl">
        🪔
      </div>
    </div>
  );
}
