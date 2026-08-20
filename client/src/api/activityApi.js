import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: `${API_URL}/api/activities`,
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

export const getActivities = async () => {
  const res = await API.get("/");
  return res.data;
};

export const addActivity = async (activity) => {
  const res = await API.post("/", activity);
  return res.data;
};

export const updateActivity = async (id, activity) => {
  const res = await API.put(`/${id}`, activity);
  return res.data;
};

export const deleteActivity = async (id) => {
  const res = await API.delete(`/${id}`);
  return res.data;
};

export default API;