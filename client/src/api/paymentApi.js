import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: `${API_URL}/api/payments`,
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

export const getPayments = async (page = 1, limit = 100) => {
  const res = await API.get(`/?page=${page}&limit=${limit}`);
  // Backend returns { payments: [...], pagination: {...} } or plain array
  return Array.isArray(res.data) ? res.data : res.data.payments || [];
};

export const getPaymentById = async (id) => {
  const res = await API.get(`/${id}`);
  return res.data;
};

export const addPayment = async (payment) => {
  const res = await API.post("/", payment);
  return res.data;
};

export const deletePayment = async (id) => {
  const res = await API.delete(`/${id}`);
  return res.data;
};

export default API;