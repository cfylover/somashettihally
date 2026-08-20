import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: `${API_URL}/api/sponsors`,
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

export const getSponsors = async () => {
  const res = await API.get("/");
  return res.data;
};

export const addSponsor = async (sponsor) => {
  const res = await API.post("/", sponsor);
  return res.data;
};

export const updateSponsor = async (id, sponsor) => {
  const res = await API.put(`/${id}`, sponsor);
  return res.data;
};

export const deleteSponsorApi = async (id) => {
  const res = await API.delete(`/${id}`);
  return res.data;
};

export default API;