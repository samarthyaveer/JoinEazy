import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Register />} />

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

      {/* Default redirect */}
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
