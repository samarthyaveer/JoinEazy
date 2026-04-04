import axios from "axios";
import {
  MOCK_STATS,
  MOCK_SUBMISSIONS,
  MOCK_ACTIVITY,
  getMockSubmissionDetail,
} from "./mockData";

/**
 * Global API configuration and axios instance.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const isDev = import.meta.env.DEV;

const withMockFallback = async (request, fallback) => {
  try {
    return await request;
  } catch (err) {
    if (isDev && err?.status === 404) {
      const data = typeof fallback === "function" ? fallback() : fallback;
      return { data };
    }
    throw err;
  }
};

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
        err.response?.data?.error ||
        err.message ||
        "Something went wrong.",
      code: err.response?.data?.code || err.code,
      field: err.response?.data?.field,
      status: err.response?.status,
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

const applySubmissionFilters = (items, params = {}) => {
  const status = params.status || "all";
  const search = (params.search || "").trim().toLowerCase();
  const sort = params.sort || "newest";

  let filtered = items.slice();

  if (status === "graded") {
    filtered = filtered.filter((s) => s.status === "graded");
  } else if (status === "ungraded") {
    filtered = filtered.filter((s) => s.status === "ungraded");
  } else if (status === "late") {
    filtered = filtered.filter((s) => s.isLate);
  }

  if (search) {
    filtered = filtered.filter((s) =>
      s.studentName.toLowerCase().includes(search),
    );
  }

  if (sort === "oldest") {
    filtered.sort(
      (a, b) => new Date(a.submitted_at) - new Date(b.submitted_at),
    );
  } else if (sort === "name") {
    filtered.sort((a, b) => a.studentName.localeCompare(b.studentName));
  } else {
    filtered.sort(
      (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at),
    );
  }

  return filtered;
};

// Assignment stats
export const getAssignmentStats = (assignmentId) =>
  withMockFallback(api.get(`/assignments/${assignmentId}/stats`), () => ({
    ...MOCK_STATS,
    assignmentId,
  }));

// All submissions for an assignment
export const getSubmissions = (assignmentId, params = {}) =>
  withMockFallback(
    api.get(`/submissions/by-assignment/${assignmentId}`, { params }),
    () => ({
      submissions: applySubmissionFilters(
        MOCK_SUBMISSIONS.filter((s) => s.assignmentId === Number(assignmentId)),
        params,
      ),
    }),
  );

// Single submission detail
export const getSubmissionDetail = (submissionId) =>
  withMockFallback(api.get(`/submissions/${submissionId}`), () => {
    const detail = getMockSubmissionDetail(submissionId);
    return detail ? { submission: detail } : { submission: null };
  });

// Save/update grade
export const saveGrade = (submissionId, payload) =>
  withMockFallback(
    api.post(`/submissions/${submissionId}/save-grade`, payload),
    () => ({
      success: true,
    }),
  );

// Publish grade
export const publishGrade = (submissionId) =>
  withMockFallback(api.post(`/submissions/${submissionId}/publish-grade`), () => ({
    success: true,
  }));

// Bulk publish
export const bulkPublishGrades = (submissionIds) =>
  withMockFallback(
    api.post(`/submissions/bulk/publish`, { submissionIds }),
    () => ({
      success: true,
      count: submissionIds.length,
    }),
  );

// Pending review count
export const getPendingReviewCount = () =>
  withMockFallback(api.get("/submissions/pending-count"), () => ({
    count: MOCK_SUBMISSIONS.filter((s) => s.status === "ungraded").length,
  }));

// Activity feed
export const getActivityFeed = (limit = 10) =>
  withMockFallback(
    api.get("/professor/activity", { params: { limit } }),
    () => ({
      activity: MOCK_ACTIVITY.slice(0, limit),
    }),
  );

// Export stats (CSV blob)
export const exportStatsCSV = (assignmentId) =>
  withMockFallback(
    api.get(`/assignments/${assignmentId}/export`, { responseType: "blob" }),
    () => new Blob([""], { type: "text/csv" }),
  );

export default api;
