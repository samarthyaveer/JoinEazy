import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Direct imports — no lazy loading. Pages are small (2-15KB each).
// Lazy loading caused blank white screens on every navigation click.
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/student/Dashboard';
import StudentAssignments from './pages/student/Assignments';
import AssignmentView from './pages/student/AssignmentView';
import MyGroups from './pages/student/MyGroups';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAssignments from './pages/admin/Assignments';
import AssignmentForm from './pages/admin/AssignmentForm';
import Analytics from './pages/admin/Analytics';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const authRedirect = user
    ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />
    : null;

  return (
    <Routes>
      {/* Auth — single sliding panel */}
      <Route path="/login" element={authRedirect || <AuthPage />} />
      <Route path="/register" element={authRedirect || <Navigate to="/login?mode=register" replace />} />

      {/* Student routes */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/assignments" element={<ProtectedRoute allowedRoles={['student']}><StudentAssignments /></ProtectedRoute>} />
      <Route path="/assignments/:id" element={<ProtectedRoute allowedRoles={['student']}><AssignmentView /></ProtectedRoute>} />
      <Route path="/my-groups" element={<ProtectedRoute allowedRoles={['student']}><MyGroups /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/assignments" element={<ProtectedRoute allowedRoles={['admin']}><AdminAssignments /></ProtectedRoute>} />
      <Route path="/admin/assignments/new" element={<ProtectedRoute allowedRoles={['admin']}><AssignmentForm /></ProtectedRoute>} />
      <Route path="/admin/assignments/:id/edit" element={<ProtectedRoute allowedRoles={['admin']}><AssignmentForm /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} />
      <Route path="/admin/analytics/:id" element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} />

      {/* Default */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
