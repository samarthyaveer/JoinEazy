import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BubbleLoader from "../BubbleLoader";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <BubbleLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin/assignments" : "/dashboard"}
        replace
      />
    );
  }

  return children;
}
