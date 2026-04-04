import { Link } from "react-router-dom";
import { timeAgo } from "@/utils/time";

export default function QuickGradeCard({
  pendingCount,
  oldestSubmission,
  moreLink,
}) {
  if (!pendingCount || pendingCount <= 0 || !oldestSubmission) return null;

  return (
    <div className="card p-6">
      <h3 className="text-section text-text-primary">
        You have {pendingCount} to grade
      </h3>
      <p className="text-meta text-text-secondary mt-2">
        Start with the oldest ungraded submission.
      </p>

      <div className="mt-5 p-4 rounded-xl border border-border bg-surface-overlay/40 flex items-center justify-between gap-4">
        <div>
          <p className="text-body font-medium text-text-primary">
            {oldestSubmission.studentName}
          </p>
          <p className="text-label text-text-tertiary mt-1">
            {oldestSubmission.assignmentTitle}
          </p>
          <p className="text-label text-text-tertiary mt-1">
            Sent {timeAgo(oldestSubmission.submitted_at)}
          </p>
        </div>
        <Link
          to={oldestSubmission.link}
          className="btn-primary btn-sm whitespace-nowrap"
        >
          Grade now
        </Link>
      </div>

      {moreLink ? (
        <div className="mt-3 text-right">
          <Link to={moreLink} className="text-label text-accent font-medium">
            {pendingCount - 1} more to grade
          </Link>
        </div>
      ) : null}
    </div>
  );
}
