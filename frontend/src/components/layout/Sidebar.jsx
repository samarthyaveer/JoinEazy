import { useCallback, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LayoutDashboard from "lucide-react/dist/esm/icons/layout-dashboard";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Users from "lucide-react/dist/esm/icons/users";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import X from "lucide-react/dist/esm/icons/x";

const STUDENT_LINKS = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/assignments", label: "Assignments", icon: FileText },
  { to: "/my-groups", label: "Groups", icon: Users },
];

const ADMIN_LINKS = [
  { to: "/admin", label: "Home", icon: LayoutDashboard },
  { to: "/admin/assignments", label: "Assignments", icon: FileText },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

/**
 * Sidebar navigation component (desktop fixed, mobile drawer).
 * @param {Object} props
 * @param {boolean} props.isOpen - For mobile, controls the drawer open state
 * @param {Function} props.onClose - For mobile, closes the drawer
 */
export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === "admin" ? ADMIN_LINKS : STUDENT_LINKS;

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 md:h-16 px-6 shrink-0 border-b border-border lg:border-transparent">
        <div className="flex items-center gap-3">
          <img src="/joineazy.png" alt="JoinEazy Logo" width={28} height={28} />
          <span className="text-body font-bold text-text-primary">
            JoinEazy
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-overlay rounded-xl transition-colors"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isExact = link.to === "/dashboard" || link.to === "/admin";
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={isExact}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-meta font-medium ${
                  isActive
                    ? "bg-accent/10 border-l-4 border-accent text-accent"
                    : "text-text-secondary hover:bg-surface-overlay hover:text-text-primary border-l-4 border-transparent"
                }`
              }
            >
              <Icon size={20} strokeWidth={1.5} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile / Logout footer */}
      <div className="p-4 border-t border-border shrink-0">
        <div className="flex items-center gap-3 px-2 py-3 mb-2 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center text-body font-bold text-accent shrink-0">
            {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-meta font-medium text-text-primary truncate">
              {user?.full_name}
            </p>
            <p className="text-label text-text-tertiary mt-0.5">
              {user?.role === "admin" ? "Professor" : "Student"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-text-secondary hover:bg-surface-overlay hover:text-semantic-danger transition-colors text-meta font-medium"
        >
          <LogOut size={20} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[280px] bg-surface transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-[240px] shrink-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
