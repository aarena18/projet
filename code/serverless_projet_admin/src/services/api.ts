import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("admin_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;

export const authService = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  getMe: () => api.get("/me"),
};

export const adminService = {
  getStats: () => api.get("/admin/stats"),
  getUsers: () => api.get("/admin/users"),
  getBackups: () => api.get("/admin/backups"),
};
