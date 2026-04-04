export default function EmptyState({ title, description, action }) {
  return (
    <div className="card px-6 py-12 flex flex-col items-center text-center">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-2xl bg-surface-overlay" />
        <div className="absolute -top-2 -left-3 w-6 h-6 rounded-full bg-accent/10 border border-accent/20" />
        <div className="absolute -bottom-2 right-1 w-8 h-2 rounded-full bg-border" />
        <div className="absolute top-4 left-4 w-8 h-8 rounded-xl border border-border bg-white" />
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
