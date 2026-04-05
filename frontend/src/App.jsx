import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import BubbleLoader from "./components/BubbleLoader";

import AuthPage from "./pages/AuthPage";

const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const StudentAssignments = lazy(() => import("./pages/student/Assignments"));
const AssignmentView = lazy(() => import("./pages/student/AssignmentView"));
const MyGroups = lazy(() => import("./pages/student/MyGroups"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminAssignments = lazy(() => import("./pages/admin/Assignments"));
const AssignmentForm = lazy(() => import("./pages/admin/AssignmentForm"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const AssignmentStats = lazy(() => import("./pages/admin/AssignmentStats"));
const SubmissionReview = lazy(() => import("./pages/admin/SubmissionReview"));
const SubmissionDetail = lazy(() => import("./pages/admin/SubmissionDetail"));
const AdminActivity = lazy(() => import("./pages/admin/Activity"));

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <BubbleLoader />;
  }

  const authRedirect = user ? (
    <Navigate
      to={user.role === "admin" ? "/admin/assignments" : "/dashboard"}
    />
  ) : null;

  return (
    <Suspense fallback={<BubbleLoader />}>
      <Routes>
        {/* Auth — single sliding panel */}
        <Route path="/login" element={authRedirect || <AuthPage />} />
        <Route
          path="/register"
          element={
            authRedirect || <Navigate to="/login?mode=register" replace />
          }
        />

        {/* Student routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentAssignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments/:id"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <AssignmentView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-groups"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <MyGroups />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assignments"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAssignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assignments/new"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AssignmentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assignments/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AssignmentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assignments/:assignmentId/stats"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AssignmentStats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assignments/:assignmentId/submissions"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SubmissionReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assignments/:assignmentId/submissions/:submissionId"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SubmissionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activity"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminActivity />
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
