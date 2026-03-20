import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;

export const authService = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post("/users", { email, password, name }),
  getMe: () => api.get("/me"),
  updateMe: (data: { name: string }) => api.patch("/me", data),
};

export const teamService = {
  getTeams: () => api.get("/teams"),
  createTeam: (name: string) => api.post("/teams", { name }),
  getTeam: (teamId: string) => api.get(`/teams/${teamId}`),
  getMembers: (teamId: string) => api.get(`/teams/${teamId}/members`),
  invite: (teamId: string, email: string) =>
    api.post(`/teams/${teamId}/invitations`, { email }),
};

export const invitationService = {
  getInvitations: () => api.get("/invitations"),
  accept: (id: string) => api.post(`/invitations/${id}/accept`),
  reject: (id: string) => api.post(`/invitations/${id}/reject`),
};

export const projectService = {
  getProjects: (teamId: string) => api.get(`/teams/${teamId}/projects`),
  createProject: (
    teamId: string,
    data: { name: string; description?: string },
  ) => api.post(`/teams/${teamId}/projects`, data),
  getProject: (projectId: string) => api.get(`/projects/${projectId}`),
  updateProject: (
    projectId: string,
    data: { name?: string; description?: string },
  ) => api.patch(`/projects/${projectId}`, data),
  deleteProject: (projectId: string) => api.delete(`/projects/${projectId}`),
};

export const taskService = {
  getTasks: (projectId: string) => api.get(`/projects/${projectId}/tasks`),
  createTask: (
    projectId: string,
    data: { name: string; description?: string },
  ) => api.post(`/projects/${projectId}/tasks`, data),
  updateTask: (taskId: string, data: { name?: string; description?: string }) =>
    api.patch(`/tasks/${taskId}`, data),
  deleteTask: (taskId: string) => api.delete(`/tasks/${taskId}`),
  updateStatus: (taskId: string, status: string) =>
    api.patch(`/tasks/${taskId}/status`, { status }),
  assign: (taskId: string, assignedUserId: string) =>
    api.patch(`/tasks/${taskId}/assign`, { assignedUserId }),
  uploadAsset: (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/tasks/${taskId}/assets`, formData);
  },
  getAssets: (taskId: string) => api.get(`/tasks/${taskId}/assets`),
};
