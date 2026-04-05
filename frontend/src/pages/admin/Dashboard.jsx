import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Plus from "lucide-react/dist/esm/icons/plus";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Clock from "lucide-react/dist/esm/icons/clock";
import PageShell from "@/components/layout/PageShell";
import ActivityFeed from "@/components/admin/ActivityFeed";
import QuickGradeCard from "@/components/admin/QuickGradeCard";
import EmptyState from "@/components/common/EmptyState";
import ErrorBanner from "@/components/common/ErrorBanner";
import {
  adminApi,
  getActivityFeed,
  getPendingReviewCount,
} from "@/services/api";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// ─── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sublabel, tone, icon }) {
  return (
    <div className="card px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-label text-text-tertiary uppercase tracking-widest">
            {label}
          </p>
          <p
            className={`text-2xl sm:text-[36px] font-bold mt-2 leading-none tabular-nums ${tone || "text-text-primary"}`}
          >
            {value}
          </p>
          {sublabel && (
            <p className="text-xs sm:text-label text-text-tertiary mt-2">
              {sublabel}
            </p>
          )}
        </div>
        {icon && <div className="mt-1">{icon}</div>}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [recent, setRecent] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [dueThisWeek, setDueThisWeek] = useState(0);

  // quickGrade: the single oldest ungraded submission across all assignments
  // Sourced from the pending-count endpoint to avoid N+1 — the backend
  // should include oldest ungraded info in getPendingReviewCount or getMetrics.
  // If the backend returns it, we use it; otherwise we leave it null.
  const [quickGrade, setQuickGrade] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(null);

  // ── Dashboard data ──────────────────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Single round-trip: overview + assignments list + pending count
      const [overviewRes, listRes, pendingRes] = await Promise.all([
        adminApi.getMetrics(),
        adminApi.getAssignments(),
        getPendingReviewCount(),
      ]);

      const overviewData = overviewRes.data.overview || {};
      const assignments = listRes.data.assignments || [];
      const pendingData = pendingRes.data;

      setOverview(overviewData);
      setRecent(assignments.slice(0, 5));
      setPendingCount(pendingData.count || 0);

      // The pending endpoint may include oldest-ungraded info.
      // If it does (oldestSubmission key), use it directly.
      // This avoids making per-assignment calls (N+1).
      if (pendingData.oldestSubmission) {
        setQuickGrade(pendingData.oldestSubmission);
      } else {
        setQuickGrade(null);
      }

      const now = Date.now();
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      setDueThisWeek(
        assignments.filter((a) => {
          const due = new Date(a.due_date).getTime();
          return due >= now && due <= now + weekMs;
        }).length,
      );
    } catch (err) {
      setError(err.message || "Couldn't load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Activity feed ───────────────────────────────────────────────────────────
  const loadActivity = useCallback(async () => {
    try {
      setActivityLoading(true);
      setActivityError(null);
      const { data } = await getActivityFeed(10);
      const items = (data.activity || data || [])
        .slice()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
      setActivity(items);
    } catch (err) {
      setActivityError(err.message || "Couldn't load activity.");
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadActivity();
  }, [loadDashboard, loadActivity]);

  // ── Metric cards ────────────────────────────────────────────────────────────
  const metricCards = useMemo(() => {
    const totalStudents = overview?.totalStudents ?? 0;
    const totalAssignments = overview?.totalAssignments ?? 0;
    const totalGroups = overview?.totalGroups ?? 0;
    const submissionRate = overview?.submissionRate ?? 0;
    return [
      { label: "Students", value: totalStudents },
      { label: "Assignments", value: totalAssignments },
      { label: "Groups", value: totalGroups },
      {
        label: "Submit rate",
        value: `${submissionRate}%`,
        tone:
          submissionRate >= 80
            ? "text-semantic-success"
            : submissionRate >= 50
              ? "text-semantic-warning"
              : "text-semantic-danger",
      },
    ];
  }, [overview]);

  return (
    <PageShell
      title="Overview"
      subtitle="Assignments, reviews, and progress at a glance."
      action={
        <Link
          to="/admin/assignments/new"
          className="btn-primary w-full sm:w-auto"
        >
          <Plus size={16} aria-hidden="true" />
          New assignment
        </Link>
      }
    >
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-28 bg-surface-overlay" />
          ))}
        </div>
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadDashboard} />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {metricCards.map((c) => (
              <MetricCard
                key={c.label}
                label={c.label}
                value={c.value}
                tone={c.tone}
              />
            ))}
            <MetricCard
              label="Reviews pending"
              value={pendingCount}
              tone={pendingCount > 0 ? "text-semantic-warning" : undefined}
              sublabel="Ungraded submissions"
              icon={
                pendingCount > 0 ? (
                  <Clock
                    size={18}
                    className="text-semantic-warning"
                    aria-hidden="true"
                  />
                ) : null
              }
            />
            <MetricCard
              label="Due this week"
              value={dueThisWeek}
              sublabel={
                dueThisWeek === 0 ? "Nothing closing soon" : "Closing soon"
              }
            />
          </div>

          <QuickGradeCard
            pendingCount={pendingCount}
            oldestSubmission={quickGrade}
            moreLink={
              pendingCount > 1 && quickGrade
                ? `/admin/assignments/${quickGrade.assignmentId}/submissions?filter=ungraded`
                : null
            }
          />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-section text-text-primary">
                Recent assignments
              </h2>
              <Link
                to="/admin/assignments"
                className="text-meta text-accent font-medium hover:text-accent-hover transition-colors"
              >
                See all
              </Link>
            </div>

            {recent.length === 0 ? (
              <EmptyState
                title="No assignments yet"
                description="Create one to get started."
                action={
                  <Link
                    to="/admin/assignments/new"
                    className="btn-primary btn-sm mt-4"
                  >
                    Create assignment
                  </Link>
                }
              />
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-overlay/60">
                      <th className="text-left px-4 py-3 text-label text-text-tertiary uppercase tracking-widest">
                        Assignment
                      </th>
                      <th className="text-left px-4 py-3 text-label text-text-tertiary uppercase tracking-widest">
                        Due
                      </th>
                      <th className="text-left px-4 py-3 text-label text-text-tertiary uppercase tracking-widest hidden sm:table-cell">
                        Groups
                      </th>
                      <th className="text-left px-4 py-3 text-label text-text-tertiary uppercase tracking-widest hidden sm:table-cell">
                        Submitted
                      </th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recent.map((a) => {
                      const rate =
                        a.total_submissions > 0
                          ? Math.round(
                              (a.submitted_count / a.total_submissions) * 100,
                            )
                          : 0;
                      return (
                        <tr
                          key={a.id}
                          className="hover:bg-surface-overlay/50 transition-colors"
                        >
                          <td className="px-4 py-4 text-body font-medium text-text-primary">
                            {a.title}
                          </td>
                          <td className="px-4 py-4 text-meta text-text-secondary font-mono tabular-nums">
                            {dateFmt.format(new Date(a.due_date))}
                          </td>
                          <td className="px-4 py-4 font-mono text-meta text-text-secondary tabular-nums hidden sm:table-cell">
                            {a.group_count || 0}
                          </td>
                          <td className="px-4 py-4 hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    rate >= 80
                                      ? "bg-semantic-success"
                                      : rate >= 50
                                        ? "bg-semantic-warning"
                                        : "bg-semantic-danger"
                                  }`}
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className="text-label text-text-tertiary font-mono tabular-nums">
                                {a.submitted_count || 0}/
                                {a.total_submissions || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Link
                              to={`/admin/assignments/${a.id}/stats`}
                              className="inline-flex items-center text-meta text-text-secondary hover:text-accent transition-colors"
                            >
                              View <ChevronRight size={14} aria-hidden="true" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ActivityFeed
            items={activity}
            isLoading={activityLoading}
            error={activityError}
            onRetry={loadActivity}
          />
        </div>
      )}
    </PageShell>
  );
}
