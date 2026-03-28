import axios from "axios";

/**
 * Global API configuration and axios instance.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor for unified error formatting and auth handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 401 handling
    if (err.response?.status === 401) {
      if (
        err.config?.url !== "/auth/me" &&
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        window.location.href = "/login";
      }
    }

    // Standardized error shape
    const formattedError = {
      message:
        err.response?.data?.message ||
        err.message ||
        "An unknown error occurred.",
      code: err.response?.data?.code || err.code,
      field: err.response?.data?.field,
    };

    return Promise.reject(formattedError);
  },
);

/**
 * Authentication API calls
 */
export const authApi = {
  getMe: () => api.get("/auth/me"),
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
};

/**
 * Admin API calls
 */
export const adminApi = {
  getMetrics: () => api.get("/analytics/overview"),
  getAnalyticsStats: () => api.get("/analytics/stats"),
  getAnalyticsAssignment: (id) => api.get(`/analytics/assignments/${id}`),
  getAssignments: () => api.get("/assignments"),
  getAssignment: (id) => api.get(`/assignments/${id}`),
  createAssignment: (data) => api.post("/assignments", data),
  updateAssignment: (id, data) => api.put(`/assignments/${id}`, data),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
  reviewSubmission: (submissionId, data) =>
    api.post(`/submissions/${submissionId}/review`, data),
};

/**
 * Student API calls
 */
export const studentApi = {
  getDashboardStats: () => api.get("/student/dashboard"),
  getAssignments: () => api.get("/assignments"),
  getAssignmentById: (id) => api.get(`/assignments/${id}`),
  getMyGroups: () => api.get("/groups/my"),
  createGroup: (assignmentId, data) =>
    api.post(`/groups/assignment/${assignmentId}`, data),
  addGroupMember: (groupId, data) =>
    api.post(`/groups/${groupId}/members`, data),
  removeGroupMember: (groupId, userId) =>
    api.delete(`/groups/${groupId}/members/${userId}`),
  trackSubmissionClick: (submissionId) =>
    api.post(`/submissions/${submissionId}/track-click`),
  initiateSubmission: (submissionId) =>
    api.post(`/submissions/${submissionId}/initiate`),
  confirmSubmission: (submissionId, data) =>
    api.post(`/submissions/${submissionId}/confirm`, data),
};

export default api;
