import { useCallback, useState, useRef, useLayoutEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { gsap, prefersReducedMotion, DURATION, EASE } from '../../lib/gsapConfig';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Users from 'lucide-react/dist/esm/icons/users';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import LogOut from 'lucide-react/dist/esm/icons/log-out';

const studentLinks = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/assignments', label: 'Assignments', icon: FileText },
  { to: '/my-groups', label: 'Groups', icon: Users },
];

const adminLinks = [
  { to: '/admin', label: 'Home', icon: LayoutDashboard },
  { to: '/admin/assignments', label: 'Assignments', icon: FileText },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

function DockItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `dock-item group relative flex items-center justify-center rounded-2xl transition-all duration-200 ${
          isActive
            ? 'bg-text-primary text-text-inverse'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
        }`
      }
      style={{ width: '48px', height: '48px' }}
      aria-label={label}
    >
      {({ isActive }) => (
        <>
          <Icon size={20} strokeWidth={isActive ? 2 : 1.5} aria-hidden="true" />
          {/* Tooltip */}
          <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-label text-text-inverse bg-text-primary shadow-card opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomDock() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'admin' ? adminLinks : studentLinks;
  const [showProfile, setShowProfile] = useState(false);
  const dockRef = useRef(null);
  const dropdownRef = useRef(null);

  // Dock entrance animation — spring slide-up
  useLayoutEffect(() => {
    if (prefersReducedMotion || !dockRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(dockRef.current, {
        y: 80,
        opacity: 0,
        duration: DURATION.NORMAL,
        delay: 0.5,
        ease: EASE.back,
      });
    });

    return () => ctx.revert();
  }, []);

  // Profile dropdown animation
  useLayoutEffect(() => {
    if (prefersReducedMotion || !dropdownRef.current) return;

    if (showProfile) {
      gsap.from(dropdownRef.current, {
        opacity: 0,
        scale: 0.95,
        y: 8,
        duration: 0.25,
        ease: EASE.back,
      });
    }
  }, [showProfile]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <nav
      ref={dockRef}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-2 rounded-[20px] shadow-dock"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-1" style={{ width: '48px', height: '48px' }}>
        <img src="/joineazy.png" alt="JoinEazy" width={26} height={26} />
      </div>

      {/* Divider */}
      <div className="w-px h-6 mx-0.5" style={{ background: 'rgba(0,0,0,0.08)' }} />

      {links.map((link) => (
        <DockItem
          key={link.to}
          to={link.to}
          label={link.label}
          icon={link.icon}
          end={link.to === '/dashboard' || link.to === '/admin'}
        />
      ))}

      {/* Divider */}
      <div className="w-px h-6 mx-0.5" style={{ background: 'rgba(0,0,0,0.08)' }} />

      {/* Profile button */}
      <div className="relative">
        <button
          onClick={() => setShowProfile(prev => !prev)}
          className={`dock-item group relative flex items-center justify-center rounded-2xl transition-all duration-200 ${
            showProfile
              ? 'bg-text-primary text-text-inverse'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
          }`}
          style={{ width: '48px', height: '48px' }}
          aria-label="Profile menu"
          aria-expanded={showProfile}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-label font-semibold"
            style={{
              background: showProfile ? 'rgba(255,255,255,0.2)' : 'rgba(0,85,255,0.1)',
              color: showProfile ? '#FFFFFF' : '#0055FF',
            }}
          >
            {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-label text-text-inverse bg-text-primary shadow-card opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
            Profile
          </span>
        </button>

        {/* Profile dropdown */}
        {showProfile ? (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
            <div
              ref={dropdownRef}
              className="absolute bottom-16 right-0 z-50 w-56 rounded-2xl p-1.5 shadow-modal"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
              }}
            >
              {/* User info */}
              <div className="flex items-center gap-3 px-3 py-3 border-b border-border">
                <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center text-label font-bold text-accent flex-shrink-0">
                  {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-meta font-medium text-text-primary truncate">{user?.full_name}</p>
                  <p className="text-label text-text-tertiary mt-0.5">{user?.role === 'admin' ? 'Professor' : 'Student'}</p>
                </div>
              </div>
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 mt-1 rounded-xl text-text-secondary hover:bg-surface-overlay hover:text-semantic-danger transition-colors text-meta"
              >
                <LogOut size={14} aria-hidden="true" />
                Sign Out
              </button>
            </div>
          </>
        ) : null}
      </div>
    </nav>
  );
}
