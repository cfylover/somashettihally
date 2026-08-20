import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: `${API_URL}/api/notifications`,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const getNotifications = async () => {
  const res = await API.get("/");
  return res.data;
};

export const addNotification = async (notification) => {
  const res = await API.post("/", notification);
  return res.data;
};

export const updateNotification = async (id, notification) => {
  const res = await API.put(`/${id}`, notification);
  return res.data;
};

export const deleteNotification = async (id) => {
  const res = await API.delete(`/${id}`);
  return res.data;
};

export default API;