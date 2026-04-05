import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Users from "lucide-react/dist/esm/icons/users";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import PageShell from "@/components/layout/PageShell";
import Modal from "@/components/common/Modal";
import ErrorBanner from "@/components/common/ErrorBanner";
import {
  RagDot,
  StatCard,
  EmptyState,
  Spinner,
} from "@/components/common/UIComponents";
import { adminApi } from "@/services/api";
import { usePageReady } from "@/context/InitialLoadContext";

// ─── Chart theme ───────────────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  background: "rgb(var(--color-surface-raised) / 0.96)",
  border: "1px solid rgb(var(--color-border) / 0.12)",
  borderRadius: "12px",
  boxShadow: "var(--shadow-card)",
  fontSize: "12px",
  color: "rgb(var(--color-text-primary))",
};
const AXIS_TICK = { fontSize: 11, fill: "rgb(var(--color-text-tertiary))" };
const AXIS_LINE = { stroke: "rgb(var(--color-border) / 0.16)" };

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// ─── Group row (expandable) ────────────────────────────────────────────────────
function GroupRow({ group, onEvaluate }) {
  const [expanded, setExpanded] = useState(false);

  const memberCount = group.members?.length || 0;
  const submittedCount =
    group.members?.filter((m) => m.submission_status === "submitted").length ||
    0;
  const ragStatus =
    submittedCount === memberCount
      ? "green"
      : submittedCount > 0
        ? "amber"
        : "red";

  const evalBadgeClass =
    group.evaluation_status === "accepted" || group.evaluation_status === "graded"
      ? "badge-success"
      : group.evaluation_status === "rejected"
        ? "badge-danger"
        : "badge-neutral";

  return (
    <>
      <tr
        className="hover:bg-surface-overlay/50 transition-colors cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <RagDot status={ragStatus} />
            <span className="text-body font-medium text-text-primary">
              {group.name}
            </span>
          </div>
        </td>
        <td
          className="px-5 py-4 font-mono text-meta text-text-secondary"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {submittedCount}/{memberCount}
        </td>
        <td className="px-5 py-4">
          <span className={`badge ${evalBadgeClass} capitalize`}>
            {group.evaluation_status || "ungraded"}
          </span>
        </td>
        <td className="px-5 py-4 text-right text-text-tertiary">
          {expanded ? (
            <ChevronUp size={14} aria-hidden="true" />
          ) : (
            <ChevronDown size={14} aria-hidden="true" />
          )}
        </td>
      </tr>

      {expanded &&
        group.members?.map((m) => {
          const memberBadge =
            m.evaluation_status === "accepted" || m.evaluation_status === "graded"
              ? "badge-success"
              : m.evaluation_status === "rejected"
                ? "badge-danger"
                : "badge-neutral";
          return (
            <tr key={m.user_id} className="bg-surface-overlay/30">
              <td className="px-5 py-3 pl-10">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-surface-overlay flex items-center justify-center text-label font-medium text-text-secondary">
                    {m.full_name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-meta font-medium text-text-primary truncate">
                      {m.full_name}
                    </p>
                    <p className="text-label text-text-tertiary truncate">
                      {m.email}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3">
                <span
                  className={`text-label font-medium capitalize ${
                    m.submission_status === "submitted"
                      ? "text-semantic-success"
                      : m.submission_status === "pending"
                        ? "text-text-tertiary"
                        : "text-semantic-warning"
                  }`}
                >
                  {m.submission_status?.replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-5 py-3">
                <span className={`badge ${memberBadge} capitalize`}>
                  {m.evaluation_status || "ungraded"}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEvaluate(group, m);
                  }}
                  className="text-meta text-accent hover:text-accent-hover font-medium transition-colors"
                >
                  Review
                </button>
              </td>
            </tr>
          );
        })}

      {expanded && (
        <tr className="bg-surface-overlay/30 border-b border-border">
          <td colSpan={4} className="px-5 py-3 pl-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEvaluate(group, null);
              }}
              className="text-meta text-accent hover:text-accent-hover font-medium transition-colors"
            >
              Review whole group
            </button>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Overview bar chart ────────────────────────────────────────────────────────
function SubmissionChart({ stats }) {
  // Truncate long titles for axis labels
  const data = useMemo(
    () =>
      stats.map((s) => ({
        ...s,
        shortTitle:
          s.title.length > 18 ? `${s.title.slice(0, 16)}…` : s.title,
        rate:
          s.total_groups > 0
            ? Math.round((s.submitted_count / s.total_groups) * 100)
            : 0,
      })),
    [stats]
  );

  return (
    <div className="card p-6">
      <h2 className="text-section text-text-primary mb-5">
        Submissions by assignment
      </h2>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barSize={28}
            margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgb(var(--color-border) / 0.12)"
            />
            <XAxis
              dataKey="shortTitle"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={AXIS_LINE}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "rgb(var(--color-accent) / 0.08)" }}
            />
            <Bar
              name="Submitted"
              dataKey="submitted_count"
              fill="rgb(var(--color-accent))"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              name="Total groups"
              dataKey="total_groups"
              fill="rgb(var(--color-text-tertiary) / 0.22)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Completion rate pies ──────────────────────────────────────────────────────
function CompletionRateMini({ stats }) {
  const overall = useMemo(() => {
    const total = stats.reduce((a, s) => a + (s.total_groups || 0), 0);
    const submitted = stats.reduce((a, s) => a + (s.submitted_count || 0), 0);
    return total > 0 ? Math.round((submitted / total) * 100) : 0;
  }, [stats]);

  const pieData = [
    { name: "Submitted", value: overall, fill: "rgb(var(--color-semantic-success))" },
    { name: "Pending", value: 100 - overall, fill: "rgb(var(--color-text-tertiary) / 0.2)" },
  ];

  return (
    <div className="card p-6 flex flex-col items-center">
      <h2 className="text-section text-text-primary mb-3 self-start">
        Overall completion
      </h2>
      <div style={{ height: 160, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              {pieData.map(({ fill, name }) => (
                <Cell key={name} fill={fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-3xl font-bold text-text-primary tabular-nums -mt-6">
        {overall}%
      </p>
      <p className="text-label text-text-tertiary mt-1">across all assignments</p>
    </div>
  );
}

// ─── Eval modal state ──────────────────────────────────────────────────────────
const INITIAL_MODAL = {
  isOpen: false,
  submissionId: null,
  groupName: "",
  targetName: "",
  userId: null,
  status: "accepted",
  feedback: "",
  submitting: false,
  error: "",
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function Analytics() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [allStats, setAllStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evalModal, setEvalModal] = useState(INITIAL_MODAL);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  usePageReady(!loading);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (id) {
          const { data } = await adminApi.getAnalyticsAssignment(id);
          setAnalytics(data.analytics);
        } else {
          const { data } = await adminApi.getAnalyticsStats();
          setAllStats(data.stats || []);
        }
      } catch (err) {
        setError(err.message || "Couldn't load analytics.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, refreshTrigger]);

  const handleEvaluate = useCallback((group, member) => {
    setEvalModal({
      isOpen: true,
      submissionId: group.submission_id,
      groupName: group.name,
      targetName: member ? member.full_name : `Group: ${group.name}`,
      userId: member?.user_id || null,
      status: "accepted",
      feedback: "",
      submitting: false,
      error: "",
    });
  }, []);

  const closeModal = useCallback(() => {
    setEvalModal((p) => ({ ...p, isOpen: false }));
  }, []);

  // ── BUG FIX: was sending `status` but route schema expects `evaluationStatus`
  const submitEvaluation = async (e) => {
    e.preventDefault();
    setEvalModal((p) => ({ ...p, submitting: true, error: "" }));
    try {
      await adminApi.reviewSubmission(evalModal.submissionId, {
        evaluationStatus: evalModal.status,   // ← correct field name
        feedback: evalModal.feedback,
        ...(evalModal.userId ? { userId: evalModal.userId } : {}),
      });
      closeModal();
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      setEvalModal((p) => ({
        ...p,
        submitting: false,
        error: err.message || "Review failed. Try again.",
      }));
    }
  };

  // ─── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell title="Insights">
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Insights">
        <ErrorBanner
          message={error}
          onRetry={() => setRefreshTrigger((p) => p + 1)}
        />
      </PageShell>
    );
  }

  // ─── Single assignment view ──────────────────────────────────────────────────
  if (id && analytics) {
    const { assignment, groups = [], ungroupedStudents = [] } = analytics;
    const totalGroups = groups.length;
    const submittedGroups = groups.filter(
      (g) => g.submission_status === "submitted"
    ).length;
    const gradedGroups = groups.filter(
      (g) =>
        g.evaluation_status === "accepted" ||
        g.evaluation_status === "graded"
    ).length;

    return (
      <PageShell
        title={assignment.title}
        subtitle={`Due ${dateFmt.format(new Date(assignment.due_date))}`}
        action={
          <Link to="/admin/analytics" className="btn-secondary btn-sm">
            <ArrowLeft size={14} aria-hidden="true" />
            All analytics
          </Link>
        }
      >
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total groups" value={totalGroups} />
          <StatCard
            label="Submitted"
            value={submittedGroups}
            sublabel={`of ${totalGroups} groups`}
          />
          <StatCard
            label="Completion"
            value={
              totalGroups > 0
                ? `${Math.round((submittedGroups / totalGroups) * 100)}%`
                : "0%"
            }
          />
          <StatCard
            label="Graded"
            value={`${gradedGroups} / ${submittedGroups}`}
            sublabel="reviewed submissions"
          />
        </div>

        {/* Progress bar */}
        {totalGroups > 0 && (
          <div className="card p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-meta font-medium text-text-primary">
                Submission progress
              </p>
              <span className="text-label text-text-tertiary font-mono tabular-nums">
                {submittedGroups} / {totalGroups}
              </span>
            </div>
            <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700"
                style={{
                  width: `${Math.round((submittedGroups / totalGroups) * 100)}%`,
                }}
              />
            </div>
            {ungroupedStudents.length > 0 && (
              <p className="text-label text-semantic-warning mt-3 flex items-center gap-1.5">
                <AlertTriangle size={13} aria-hidden="true" />
                {ungroupedStudents.length} student
                {ungroupedStudents.length === 1 ? "" : "s"} not in any group
              </p>
            )}
          </div>
        )}

        {/* Groups table */}
        {groups.length === 0 ? (
          <EmptyState icon={Users} title="No groups yet" />
        ) : (
          <div className="card overflow-hidden mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-overlay/50">
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">
                    Group
                  </th>
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">
                    Submitted
                  </th>
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groups.map((g) => (
                  <GroupRow key={g.id} group={g} onEvaluate={handleEvaluate} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Ungrouped students */}
        {ungroupedStudents.length > 0 && (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-semantic-warning/5 border-b border-semantic-warning/20">
              <AlertTriangle
                size={14}
                className="text-semantic-warning"
                aria-hidden="true"
              />
              <span className="text-meta font-medium text-text-primary">
                Ungrouped students ({ungroupedStudents.length})
              </span>
            </div>
            <div className="divide-y divide-border">
              {ungroupedStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-full bg-surface-overlay flex items-center justify-center text-label font-medium text-text-secondary">
                    {s.full_name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-meta font-medium text-text-primary truncate">
                      {s.full_name}
                    </p>
                    <p className="text-label text-text-tertiary truncate">
                      {s.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evaluation modal */}
        <Modal isOpen={evalModal.isOpen} onClose={closeModal} title="Review submission">
          <form onSubmit={submitEvaluation} className="space-y-5">
            <div>
              <p className="text-label text-text-tertiary uppercase tracking-widest mb-1">
                Reviewing
              </p>
              <p className="text-body font-medium text-text-primary">
                {evalModal.targetName}
              </p>
              <p className="text-meta text-text-secondary mt-0.5">
                {evalModal.groupName}
              </p>
            </div>

            <div>
              <label className="block text-meta font-medium text-text-primary mb-2">
                Outcome
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "accepted", label: "Accept" },
                  { value: "rejected", label: "Reject" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setEvalModal((p) => ({ ...p, status: value }))
                    }
                    className={`px-4 text-meta font-medium rounded-xl border h-10 transition-all capitalize ${
                      evalModal.status === value
                        ? value === "accepted"
                          ? "border-semantic-success/30 bg-semantic-success/10 text-semantic-success"
                          : "border-semantic-danger/30 bg-semantic-danger/10 text-semantic-danger"
                        : "border-border-strong text-text-secondary hover:bg-surface-overlay"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className="block text-meta font-medium text-text-primary mb-2"
                htmlFor="eval-feedback"
              >
                Feedback
              </label>
              <textarea
                id="eval-feedback"
                name="evaluationFeedback"
                className="input-field min-h-[100px] resize-y"
                placeholder="Add feedback for the student…"
                value={evalModal.feedback}
                onChange={(e) =>
                  setEvalModal((p) => ({ ...p, feedback: e.target.value }))
                }
              />
            </div>

            {evalModal.error && (
              <div className="text-meta text-semantic-danger bg-semantic-danger/8 border border-semantic-danger/15 rounded-xl px-4 py-3">
                {evalModal.error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={evalModal.submitting}
              >
                {evalModal.submitting ? "Submitting…" : "Submit review"}
              </button>
            </div>
          </form>
        </Modal>
      </PageShell>
    );
  }

  // ─── All-assignments overview ────────────────────────────────────────────────
  return (
    <PageShell title="Insights" subtitle="Submission stats across assignments">
      {allStats.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Create assignments to see stats here."
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <SubmissionChart stats={allStats} />
            <CompletionRateMini stats={allStats} />
          </div>

          {/* Stats table */}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-overlay/50">
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">
                    Assignment
                  </th>
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">
                    Groups
                  </th>
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">
                    Submitted
                  </th>
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">
                    Rate
                  </th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allStats.map((s) => {
                  const rate =
                    s.total_groups > 0
                      ? Math.round((s.submitted_count / s.total_groups) * 100)
                      : 0;
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-surface-overlay/50 transition-colors"
                    >
                      <td className="px-5 py-4 text-body font-medium text-text-primary">
                        {s.title}
                      </td>
                      <td
                        className="px-5 py-4 font-mono text-meta text-text-secondary tabular-nums"
                      >
                        {s.total_groups}
                      </td>
                      <td
                        className="px-5 py-4 font-mono text-meta text-text-secondary tabular-nums"
                      >
                        {s.submitted_count}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
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
                            {rate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/analytics/${s.id}`}
                          className="text-meta text-accent hover:text-accent-hover font-medium transition-colors"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
}
