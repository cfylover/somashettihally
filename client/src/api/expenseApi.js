import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: `${API_URL}/api/expenses`,
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

export const getExpenses = async () => {
  const res = await API.get("/");
  return res.data;
};

export const addExpense = async (expense) => {
  const res = await API.post("/", expense);
  return res.data;
};

export const updateExpense = async (id, expense) => {
  const res = await API.put(`/${id}`, expense);
  return res.data;
};

export const deleteExpense = async (id) => {
  const res = await API.delete(`/${id}`);
  return res.data;
};

export default API;