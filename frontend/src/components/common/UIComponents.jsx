export function StatusBadge({ status }) {
  const config = {
    pending:                { label: 'Pending',      className: 'badge-neutral' },
    link_visited:           { label: 'Link Visited', className: 'badge-info' },
    awaiting_confirmation:  { label: 'Awaiting Confirmation', className: 'badge-warning' },
    submitted:              { label: 'Submitted',    className: 'badge-success' },
  };

  const c = config[status] || config.pending;
  return <span className={c.className}>{c.label}</span>;
}

export function RagDot({ status }) {
  const colorMap = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-400',
    red:   'bg-red-500',
  };

  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colorMap[status] || colorMap.red}`}
      title={status}
    />
  );
}

export function ProgressBar({ value, max = 100 }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-text-secondary font-mono w-9 text-right">{pct}%</span>
    </div>
  );
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <h3 className="text-sm font-medium text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}

export function StatCard({ label, value, sublabel }) {
  return (
    <div className="card px-4 py-3.5">
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-text-primary mt-1">{value}</p>
      {sublabel && <p className="text-xs text-text-tertiary mt-0.5">{sublabel}</p>}
    </div>
  );
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };
  return (
    <div className={`${sizes[size]} border-2 border-brand-600 border-t-transparent rounded-full animate-spin`} />
  );
}
