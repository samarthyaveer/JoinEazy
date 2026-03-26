import Sidebar from './Sidebar';

export default function PageShell({ title, subtitle, action, children }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-56">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
              {subtitle && (
                <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>

          {/* Page content */}
          {children}
        </div>
      </main>
    </div>
  );
}
