import { useCallback, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/common/ThemeToggle";
import LayoutDashboard from "lucide-react/dist/esm/icons/layout-dashboard";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Users from "lucide-react/dist/esm/icons/users";
import Plus from "lucide-react/dist/esm/icons/plus";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import X from "lucide-react/dist/esm/icons/x";

const STUDENT_LINKS = [
  {
    to: "/dashboard",
    label: "Overview",
    shortLabel: "Home",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/assignments",
    label: "Assignments",
    shortLabel: "Work",
    icon: FileText,
    exact: true,
  },
  {
    to: "/my-groups",
    label: "Groups",
    shortLabel: "Groups",
    icon: Users,
    exact: true,
  },
];

const ADMIN_LINKS = [
  {
    to: "/admin/assignments",
    label: "Assignments",
    shortLabel: "List",
    icon: FileText,
    exact: true,
  },
  {
    to: "/admin/assignments/new",
    label: "New assignment",
    shortLabel: "New",
    icon: Plus,
    exact: true,
  },
  {
    to: "/admin",
    label: "Overview",
    shortLabel: "Home",
    icon: LayoutDashboard,
    exact: true,
  },
];

function getUserInitials(fullName) {
  return (fullName || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === "admin" ? ADMIN_LINKS : STUDENT_LINKS;

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  const handleNavClick = useCallback(() => {
    if (window.innerWidth < 1024) onClose();
  }, [onClose]);

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[300px] max-w-[88vw] bg-surface-overlay/70 backdrop-blur-2xl border-r border-border/60 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-5 border-b border-border/60">
            <div className="flex items-center gap-3">
              <img
                src="/joineazy.png"
                alt="JoinEazy Logo"
                width={30}
                height={30}
              />
              <div>
                <p className="text-body font-semibold text-text-primary">
                  JoinEazy
                </p>
                <p className="text-label text-text-secondary">
                  {user?.role === "admin"
                    ? "Instructor workspace"
                    : "Student workspace"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 inline-flex items-center justify-center rounded-2xl text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-colors"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-[20px] px-4 py-3 text-meta font-medium transition-colors ${
                      isActive
                        ? "bg-accent text-white shadow-lg shadow-accent/15"
                        : "text-text-primary hover:bg-surface-overlay hover:text-text-primary"
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={1.75} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-border/60 px-4 py-4 space-y-3">
            <ThemeToggle />

            <div className="rounded-[24px] border border-border/60 bg-surface-overlay/60 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-accent text-white flex items-center justify-center text-meta font-semibold">
                  {getUserInitials(user?.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="text-meta font-medium text-text-primary truncate">
                    {user?.full_name}
                  </p>
                  <p className="text-label text-text-tertiary">
                    {user?.role === "admin" ? "Professor" : "Student"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary w-full mt-4"
              >
                <LogOut size={16} aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="hidden lg:flex fixed left-1/2 bottom-5 -translate-x-1/2 z-40">
        <div className="flex items-center gap-2 rounded-[32px] border border-border/60 bg-surface-overlay/70 px-3 py-3 shadow-[0_22px_50px_rgba(15,15,15,0.14)] backdrop-blur-2xl">
          <div className="hidden xl:flex items-center gap-3 rounded-[22px] bg-surface-overlay/70 px-4 py-3 border border-border/60">
            <img
              src="/joineazy.png"
              alt="JoinEazy Logo"
              width={28}
              height={28}
            />
            <div>
              <p className="text-meta font-semibold text-text-primary leading-none">
                JoinEazy
              </p>
              <p className="text-label text-text-tertiary mt-1">
                {user?.role === "admin" ? "Professor mode" : "Student mode"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact}
                  className={({ isActive }) =>
                    `flex min-w-[92px] flex-col items-center justify-center gap-1 rounded-[22px] px-4 py-3 text-label font-medium transition-colors ${
                      isActive
                        ? "bg-accent text-white shadow-lg shadow-accent/20"
                        : "text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={1.75} />
                  <span>{link.shortLabel}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="w-px h-12 bg-border/60 mx-1" />

          <div className="flex items-center gap-2">
            <ThemeToggle compact />

            <div className="hidden 2xl:flex items-center gap-3 rounded-[22px] bg-surface-overlay/70 px-4 py-3 border border-border/60">
              <div className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center text-meta font-semibold">
                {getUserInitials(user?.full_name)}
              </div>
              <div className="min-w-0">
                <p className="text-meta font-medium text-text-primary truncate">
                  {user?.full_name}
                </p>
                <p className="text-label text-text-tertiary">
                  {user?.role === "admin" ? "Professor" : "Student"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-[56px] w-[56px] items-center justify-center rounded-[22px] text-text-secondary hover:bg-surface-overlay hover:text-semantic-danger transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
