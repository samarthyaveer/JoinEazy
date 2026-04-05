export default function EmptyState({ title, description, action }) {
  return (
    <div className="card px-6 py-12 flex flex-col items-center text-center relative overflow-hidden">
      <div
        className="absolute -top-20 right-0 w-48 h-48 rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-2xl bg-surface-overlay/70 border border-border" />
        <div className="absolute -top-2 -left-3 w-6 h-6 rounded-full bg-accent/20 border border-accent/30" />
        <div className="absolute -bottom-2 right-1 w-8 h-2 rounded-full bg-border/60" />
        <div className="absolute top-4 left-4 w-8 h-8 rounded-xl border border-border bg-surface-raised/90" />
      </div>
      <h3 className="text-section text-text-primary">{title}</h3>
      {description ? (
        <p className="text-meta text-text-secondary mt-2 max-w-md">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
