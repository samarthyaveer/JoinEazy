import { Link } from "react-router-dom";
import ErrorBanner from "@/components/common/ErrorBanner";
import EmptyState from "@/components/common/EmptyState";
import { timeAgo } from "@/utils/time";

const getInitials = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const describeEvent = (event) => {
  if (event.type === "submitted") {
    return `${event.studentName} sent ${event.assignmentName}`;
  }
  if (event.type === "regrade") {
    return `${event.studentName} requested regrade for ${event.assignmentName}`;
  }
  if (event.type === "published") {
    return `Grades published for ${event.assignmentName} (${event.count} students)`;
  }
  return "Recent update";
};

export default function ActivityFeed({ items, isLoading, error, onRetry }) {
  if (isLoading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-4 w-40 bg-surface-overlay rounded mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-surface-overlay rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={onRetry} />;
  }

  if (!items?.length) {
    return (
      <EmptyState
        title="No activity"
        description="Actions show up after submissions."
      />
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-section text-text-primary">Latest activity</h3>
        <Link
          to="/admin/activity"
          className="text-label text-accent font-medium"
        >
          See all
        </Link>
      </div>
      <div className="space-y-4">
        {items.map((event, idx) => (
          <div key={`${event.type}-${idx}`} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-label font-semibold">
              {getInitials(event.studentName || "You")}
            </div>
            <div className="flex-1">
              <p className="text-meta text-text-primary">
                {describeEvent(event)}
              </p>
              <p className="text-label text-text-tertiary mt-1">
                {timeAgo(event.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
