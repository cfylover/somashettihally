import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const authAPI = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Login
export const loginUser = async (username, password) => {
  const res = await authAPI.post("/login", {
    username,
    password,
  });

  return res.data;
};

export default authAPI;