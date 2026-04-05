import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { InitialLoadProvider, useInitialLoad } from "./context/InitialLoadContext";
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

function RouteSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
    </div>
  );
}

function RouteReady({ children }) {
  const { markStepReady } = useInitialLoad();

  useEffect(() => {
    markStepReady("route");
  }, [markStepReady]);

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const { progress, inProgress } = useInitialLoad();

  if (loading) {
    return <BubbleLoader progress={progress} />;
  }

  const authRedirect = user ? (
    <Navigate to={user.role === "admin" ? "/admin/assignments" : "/dashboard"} />
  ) : null;

  return (
    <>
      <Suspense fallback={<RouteSpinner />}>
        <RouteReady>
          <Routes>
            {/* Auth — single sliding panel */}
            <Route path="/login" element={authRedirect || <AuthPage />} />
            <Route
              path="/register"
              element={authRedirect || <Navigate to="/login?mode=register" replace />}
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
        </RouteReady>
      </Suspense>
      {inProgress ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
          }}
        >
          <BubbleLoader progress={progress} />
        </div>
      ) : null}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <InitialLoadProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </InitialLoadProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
