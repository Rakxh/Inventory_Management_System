import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  window.__APP_CONFIG__?.API_URL ||
  "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Pull a readable message out of FastAPI's error shapes so components
// can just show err.message without caring about the response format.
export function getErrorMessage(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || "Something went wrong. Please try again.";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((e) => `${e.loc?.at(-1)}: ${e.msg}`).join(" · ");
  }
  return "Something went wrong. Please try again.";
}

// Products
export const listProducts = () => api.get("/products").then((r) => r.data);
export const createProduct = (payload) => api.post("/products", payload).then((r) => r.data);
export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload).then((r) => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Customers
export const listCustomers = () => api.get("/customers").then((r) => r.data);
export const createCustomer = (payload) => api.post("/customers", payload).then((r) => r.data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// Orders
export const listOrders = () => api.get("/orders").then((r) => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data);
export const createOrder = (payload) => api.post("/orders", payload).then((r) => r.data);
export const cancelOrder = (id) => api.delete(`/orders/${id}`);

// Dashboard
export const getDashboardSummary = () => api.get("/dashboard/summary").then((r) => r.data);
