import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '◫' },
  { to: '/assignments', label: 'Assignments', icon: '📋' },
  { to: '/my-groups', label: 'My Groups', icon: '👥' },
];

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '◫' },
  { to: '/admin/assignments', label: 'Assignments', icon: '📋' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📊' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-surface-secondary border-r flex flex-col z-30">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-4 border-b">
        <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">JE</span>
        </div>
        <span className="font-semibold text-sm text-text-primary">JoinEazy</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard' || link.to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`
            }
          >
            <span className="text-base leading-none">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 mb-2 px-1">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
            {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-text-tertiary capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full btn-ghost text-xs justify-start px-3">
          Sign out
        </button>
      </div>
    </aside>
  );
}
