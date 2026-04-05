import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="card px-5 py-4 border border-semantic-danger/25 bg-semantic-danger/8 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-semantic-danger/10 flex items-center justify-center text-semantic-danger">
          <AlertTriangle size={16} aria-hidden="true" />
        </div>
        <div>
          <p className="text-meta font-medium text-text-primary">
            Something broke
          </p>
          <p className="text-label text-text-tertiary mt-1">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <button onClick={onRetry} className="btn-secondary btn-sm">
          Try again
        </button>
      ) : null}
    </div>
  );
}
