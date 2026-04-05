import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Download from "lucide-react/dist/esm/icons/download";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import PageShell from "@/components/layout/PageShell";
import ErrorBanner from "@/components/common/ErrorBanner";
import EmptyState from "@/components/common/EmptyState";
import BubbleLoader from "@/components/BubbleLoader";
import { getAssignmentStats } from "@/services/api";
import { gradeLetterFromPercent, percentFromScore } from "@/utils/grade";

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

const GRADE_COLOURS = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  F: "#ef4444",
};

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card px-5 py-5">
      <p className="text-label text-text-tertiary uppercase tracking-widest mb-2">
        {label}
      </p>
      <p
        className={`text-3xl font-bold leading-none tabular-nums ${accent || "text-text-primary"}`}
      >
        {value}
      </p>
      {sub && <p className="text-label text-text-tertiary mt-2">{sub}</p>}
    </div>
  );
}

// ─── Score distribution (histogram) ───────────────────────────────────────────
function ScoreHistogram({ scores, totalMarks, averageScore }) {
  const data = useMemo(() => {
    const bucketCount = 10;
    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      range: `${i * 10}–${(i + 1) * 10}%`,
      count: 0,
    }));
    scores.forEach((score) => {
      const pct =
        totalMarks > 0 ? Math.min((score / totalMarks) * 100, 100) : 0;
      const idx = Math.min(Math.floor(pct / 10), bucketCount - 1);
      buckets[idx].count += 1;
    });
    return buckets;
  }, [scores, totalMarks]);

  const avgPct = totalMarks > 0 ? (averageScore / totalMarks) * 100 : 0;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-section text-text-primary">Score distribution</h3>
          <p className="text-label text-text-tertiary mt-1">
            Class average:{" "}
            <span className="font-medium text-text-primary tabular-nums">
              {Number(averageScore).toFixed(1)} / {totalMarks} (
              {avgPct.toFixed(1)}%)
            </span>
          </p>
        </div>
        {/* Pass / fail legend dots */}
        <div className="flex items-center gap-4 text-label text-text-tertiary">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-semantic-success inline-block" />
            Pass ≥60%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-semantic-danger inline-block" />
            Fail
          </span>
        </div>
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 0, bottom: 0, left: -20 }}
            barSize={24}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgb(var(--color-border) / 0.12)"
            />
            <XAxis
              dataKey="range"
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
              formatter={(v) => [v, "Students"]}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, idx) => {
                // Colour buckets: 0-5 (0-50%) = red, 6 (60-70%) = amber, 7-9 = green
                const isPass = idx >= 6;
                return (
                  <Cell
                    key={`cell-${idx}`}
                    fill={
                      isPass
                        ? idx >= 8
                          ? "#22c55e"
                          : "#86efac"
                        : idx >= 4
                          ? "#fca5a5"
                          : "#ef4444"
                    }
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Grade letter pie ──────────────────────────────────────────────────────────
function GradeDistributionPie({ submissions, totalMarks }) {
  const data = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    submissions.forEach((s) => {
      const pct = percentFromScore(
        typeof s.totalScore === "number" ? s.totalScore : 0,
        s.totalMarks || totalMarks,
      );
      counts[gradeLetterFromPercent(pct)] =
        (counts[gradeLetterFromPercent(pct)] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([grade, count]) => ({ grade, count }));
  }, [submissions, totalMarks]);

  if (!data.length) return null;

  return (
    <div className="card p-5">
      <h3 className="text-section text-text-primary mb-5">Grade breakdown</h3>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              dataKey="count"
              nameKey="grade"
              paddingAngle={3}
              label={({ grade, percent: p }) =>
                `${grade} ${(p * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {data.map(({ grade }) => (
                <Cell key={grade} fill={GRADE_COLOURS[grade] || "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v, n) => [v, `Grade ${n}`]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => `Grade ${value}`}
              wrapperStyle={{
                fontSize: 11,
                color: "rgb(var(--color-text-tertiary))",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── On-time vs late mini pie ──────────────────────────────────────────────────
function LateSubmissionPie({ submissions }) {
  const data = useMemo(() => {
    const late = submissions.filter((s) => s.isLate).length;
    const onTime = submissions.length - late;
    return [
      { label: "On time", count: onTime, fill: "#22c55e" },
      { label: "Late", count: late, fill: "#f59e0b" },
    ].filter((d) => d.count > 0);
  }, [submissions]);

  if (!data.length) return null;

  return (
    <div className="card p-5">
      <h3 className="text-section text-text-primary mb-5">On-time vs late</h3>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={70}
              dataKey="count"
              nameKey="label"
              paddingAngle={4}
              label={({ label, percent: p }) =>
                `${label} ${(p * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {data.map(({ fill, label }) => (
                <Cell key={label} fill={fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v, n) => [v, n]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Question accuracy bar chart ───────────────────────────────────────────────
function QuestionAccuracyChart({ questions }) {
  const data = useMemo(
    () =>
      questions.map((q, i) => ({
        label: `Q${i + 1}`,
        accuracy: typeof q.accuracy === "number" ? Math.round(q.accuracy) : 0,
        avgScore:
          typeof q.avgScore === "number" ? Number(q.avgScore.toFixed(1)) : 0,
        maxMarks: q.maxMarks,
      })),
    [questions],
  );

  if (!data.length) return null;

  return (
    <div className="card p-5">
      <h3 className="text-section text-text-primary mb-1">Question accuracy</h3>
      <p className="text-label text-text-tertiary mb-5">
        % of students who answered correctly
      </p>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
            barSize={16}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="rgb(var(--color-border) / 0.12)"
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={AXIS_LINE}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "rgb(var(--color-accent) / 0.08)" }}
              formatter={(v) => [`${v}%`, "Accuracy"]}
            />
            <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
              {data.map(({ accuracy }, idx) => (
                <Cell
                  key={`q-${idx}`}
                  fill={
                    accuracy >= 70
                      ? "#22c55e"
                      : accuracy >= 50
                        ? "#f59e0b"
                        : "#ef4444"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── CSV export ────────────────────────────────────────────────────────────────
const toCsvValue = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function AssignmentStats() {
  const { assignmentId } = useParams();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!assignmentId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await getAssignmentStats(assignmentId);
      setStats(data);
    } catch (err) {
      setError(err.message || "Couldn't load stats.");
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const submissions = stats?.submissions || [];
  const totalMarks = stats?.assignment?.totalMarks || 100;

  // ── Summary stat cards ──────────────────────────────────────────────────────
  const metricCards = useMemo(() => {
    if (!stats) return [];
    const {
      submissionCount = 0,
      gradedCount = 0,
      averageScore = 0,
      passRate = 0,
      highestScore = 0,
      lowestScore = 0,
    } = stats;
    return [
      { label: "Submissions", value: submissionCount },
      {
        label: "Graded",
        value: `${gradedCount} / ${submissionCount}`,
        sub:
          submissionCount > 0
            ? `${Math.round((gradedCount / submissionCount) * 100)}% graded`
            : null,
      },
      {
        label: "Class average",
        value: `${Number(averageScore).toFixed(1)}`,
        sub: `out of ${totalMarks}`,
      },
      {
        label: "Pass rate",
        value: `${Number(passRate).toFixed(1)}%`,
        accent:
          passRate >= 70
            ? "text-semantic-success"
            : passRate >= 50
              ? "text-semantic-warning"
              : "text-semantic-danger",
      },
      {
        label: "Highest score",
        value: highestScore,
        accent: "text-semantic-success",
      },
      {
        label: "Lowest score",
        value: lowestScore,
        accent:
          lowestScore < totalMarks * 0.4 ? "text-semantic-danger" : undefined,
      },
    ];
  }, [stats, totalMarks]);

  // ── CSV download ────────────────────────────────────────────────────────────
  const downloadCsv = () => {
    if (!submissions.length) return;
    const headers = [
      "student_name",
      "student_email",
      "score",
      "max_marks",
      "percentage",
      "grade_letter",
      "submitted_at",
      "is_late",
      "feedback_given",
    ];
    const rows = submissions.map((s) => {
      const score = typeof s.totalScore === "number" ? s.totalScore : 0;
      const marks = s.totalMarks || totalMarks;
      const pct = percentFromScore(score, marks);
      return [
        toCsvValue(s.studentName),
        toCsvValue(s.studentEmail),
        score,
        marks,
        pct,
        gradeLetterFromPercent(pct),
        toCsvValue(s.submitted_at),
        s.isLate ? "yes" : "no",
        s.feedback ? "yes" : "no",
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assignment-${assignmentId}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const title = stats?.assignment?.title || "Assignment insights";

  if (isLoading) {
    return <BubbleLoader />;
  }

  return (
    <PageShell
      title={title}
      subtitle="Scores, grade breakdown, and question trends"
      action={
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/assignments" className="btn-secondary btn-sm">
            <ArrowLeft size={14} aria-hidden="true" />
            Back
          </Link>
          <Link
            to={`/admin/assignments/${assignmentId}/submissions`}
            className="btn-secondary btn-sm"
          >
            <ClipboardList size={14} aria-hidden="true" />
            Review work
          </Link>
          <button
            onClick={downloadCsv}
            className="btn-primary btn-sm"
            disabled={!submissions.length}
          >
            <Download size={14} aria-hidden="true" />
            Export CSV
          </button>
        </div>
      }
    >
      {error ? (
        <ErrorBanner message={error} onRetry={fetchStats} />
      ) : !stats ? (
        <EmptyState
          title="No stats yet"
          description="Students need to submit work before stats appear here."
        />
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {metricCards.map((c) => (
              <StatCard
                key={c.label}
                label={c.label}
                value={c.value}
                sub={c.sub}
                accent={c.accent}
              />
            ))}
          </div>

          {/* Charts row 1: histogram + grade pie */}
          {submissions.length > 0 && (
            <>
              <ScoreHistogram
                scores={submissions.map((s) =>
                  typeof s.totalScore === "number" ? s.totalScore : 0,
                )}
                totalMarks={totalMarks}
                averageScore={stats.averageScore ?? 0}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <GradeDistributionPie
                  submissions={submissions}
                  totalMarks={totalMarks}
                />
                <LateSubmissionPie submissions={submissions} />
              </div>
            </>
          )}

          {/* Question accuracy */}
          {(stats.questions || []).length > 0 && (
            <QuestionAccuracyChart questions={stats.questions} />
          )}

          {/* Submission table */}
          {submissions.length > 0 && (
            <div className="card overflow-x-auto">
              <div className="px-5 py-3 border-b border-border bg-surface-overlay/50">
                <h3 className="text-section text-text-primary">
                  All submissions
                </h3>
              </div>
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border text-label text-text-tertiary uppercase tracking-widest">
                    <th className="text-left px-5 py-3">Student</th>
                    <th className="text-left px-5 py-3">Score</th>
                    <th className="text-left px-5 py-3">Grade</th>
                    <th className="text-left px-5 py-3 hidden sm:table-cell">
                      Submitted
                    </th>
                    <th className="text-left px-5 py-3">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {submissions.map((s, i) => {
                    const score =
                      typeof s.totalScore === "number" ? s.totalScore : null;
                    const marks = s.totalMarks || totalMarks;
                    const pct =
                      score !== null ? percentFromScore(score, marks) : null;
                    const grade =
                      pct !== null ? gradeLetterFromPercent(pct) : null;
                    return (
                      <tr
                        key={s.id || i}
                        className="hover:bg-surface-overlay/40 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <p className="text-body font-medium text-text-primary">
                            {s.studentName}
                          </p>
                          <p className="text-label text-text-tertiary">
                            {s.studentEmail}
                          </p>
                        </td>
                        <td className="px-5 py-3 font-mono text-meta tabular-nums">
                          {score !== null
                            ? `${score} / ${marks} (${pct}%)`
                            : "—"}
                        </td>
                        <td className="px-5 py-3">
                          {grade ? (
                            <span
                              className="text-meta font-bold"
                              style={{
                                color: GRADE_COLOURS[grade] || "#94a3b8",
                              }}
                            >
                              {grade}
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              Needs grade
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-meta text-text-secondary hidden sm:table-cell">
                          {s.submitted_at
                            ? new Date(s.submitted_at).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short" },
                              )
                            : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {s.isLate && (
                              <span className="badge badge-warning">Late</span>
                            )}
                            {s.regradeRequested && (
                              <span className="badge border border-purple-200 text-purple-700 bg-purple-50">
                                Regrade
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
