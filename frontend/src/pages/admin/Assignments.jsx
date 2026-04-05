import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Plus from "lucide-react/dist/esm/icons/plus";
import Search from "lucide-react/dist/esm/icons/search";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Copy from "lucide-react/dist/esm/icons/copy";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import Users from "lucide-react/dist/esm/icons/users";
import PageShell from "@/components/layout/PageShell";
import {
  EmptyState,
  Spinner,
  ProgressBar,
  StatCard,
} from "@/components/common/UIComponents";
import ErrorBanner from "@/components/common/ErrorBanner";
import { useStagger } from "@/hooks/useGsap";
import { adminApi } from "@/services/api";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const FILTERS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past due" },
];

function getSubmissionRate(assignment) {
  if (!assignment.total_submissions) return 0;
  return Math.round(
    (assignment.submitted_count / assignment.total_submissions) * 100,
  );
}

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const cardsRef = useStagger({
    selector: "[data-assignment-card]",
    stagger: 0.05,
    y: 18,
    delay: 0.15,
  });

  const loadAssignments = useCallback(async () => {
    try {
      setError("");
      const res = await adminApi.getAssignments();
      setAssignments(res.data.assignments || []);
    } catch (err) {
      setError(err.message || "Couldn't load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this assignment? This removes all groups and submissions.",
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteAssignment(id);
      setNotice("Assignment deleted.");
      loadAssignments();
    } catch (err) {
      setNotice(err.message || "Delete failed. Try again.");
    }
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Submission folder link copied.");
    } catch {
      setNotice("Couldn't copy the link on this device.");
    }
  };

  const filteredAssignments = useMemo(() => {
    const now = new Date();
    const lowerQuery = query.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const dueDate = new Date(assignment.due_date);
      const matchesQuery =
        !lowerQuery ||
        assignment.title.toLowerCase().includes(lowerQuery) ||
        (assignment.description || "").toLowerCase().includes(lowerQuery);

      const matchesFilter =
        filter === "all" ||
        (filter === "upcoming" && dueDate >= now) ||
        (filter === "past" && dueDate < now);

      return matchesQuery && matchesFilter;
    });
  }, [assignments, filter, query]);

  const stats = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const dueSoon = assignments.filter((assignment) => {
      const due = new Date(assignment.due_date);
      return due >= now && due <= nextWeek;
    }).length;

    const totalGroups = assignments.reduce(
      (sum, assignment) => sum + assignment.group_count,
      0,
    );
    const totalSubmitted = assignments.reduce(
      (sum, assignment) => sum + assignment.submitted_count,
      0,
    );

    return {
      dueSoon,
      totalGroups,
      totalSubmitted,
    };
  }, [assignments]);

  if (loading) {
    return (
      <PageShell
        title="Assignments"
        subtitle="Loading your professor workspace"
      >
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Assignments" subtitle="Create and manage coursework">
        <ErrorBanner message={error} onRetry={loadAssignments} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Assignments"
      subtitle="Create, review, and track assignment readiness in one place."
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
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Total assignments" value={assignments.length} />
        <StatCard label="Due this week" value={stats.dueSoon} />
        <StatCard
          className="col-span-2 xl:col-span-1"
          label="Submitted groups"
          value={stats.totalSubmitted}
          sublabel={`${stats.totalGroups} groups created`}
        />
      </div>

      <div className="card p-4 sm:p-5 mb-5 sm:mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              aria-hidden="true"
            />
            <input
              id="assignment-search"
              name="assignmentSearch"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input-field pl-9"
              placeholder="Search by assignment title or instructions"
              aria-label="Search assignments"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={
                  filter === item.id
                    ? "btn-primary btn-sm"
                    : "btn-secondary btn-sm"
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {notice ? (
          <p className="text-meta text-text-secondary mt-4">{notice}</p>
        ) : null}
      </div>

      {filteredAssignments.length === 0 ? (
        assignments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No assignments yet"
            description="Create one and it will appear here with progress and submission folder actions."
            action={
              <Link to="/admin/assignments/new" className="btn-primary btn-sm">
                Create assignment
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No matching assignments"
            description="Try a different keyword or switch the filter."
          />
        )
      ) : (
        <div
          ref={cardsRef}
          className="grid grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-5"
        >
          {filteredAssignments.map((assignment) => {
            const dueDate = new Date(assignment.due_date);
            const isPastDue = dueDate < new Date();
            const submissionRate = getSubmissionRate(assignment);

            return (
              <article
                key={assignment.id}
                data-assignment-card
                className="card p-4 sm:p-5 lg:p-6"
              >
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          className={`badge ${isPastDue ? "badge-danger" : "badge-neutral"}`}
                        >
                          {isPastDue ? "Past due" : "Active"}
                        </span>
                        <span className="badge badge-neutral">
                          {submissionRate}% submitted
                        </span>
                      </div>
                      <h2 className="text-section text-text-primary leading-tight">
                        {assignment.title}
                      </h2>
                      <p className="text-body text-text-secondary mt-2">
                        {assignment.description ||
                          "No extra instructions yet. Open the assignment to refine the brief."}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/admin/assignments/${assignment.id}/edit`)
                      }
                      className="btn-primary btn-sm shrink-0"
                    >
                      <Pencil size={14} aria-hidden="true" />
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="rounded-[22px] border border-border bg-surface-overlay/65 p-4">
                      <div className="flex items-center gap-2 text-label uppercase tracking-widest text-text-tertiary">
                        <CalendarClock size={14} aria-hidden="true" />
                        Due
                      </div>
                      <p className="text-body font-semibold text-text-primary mt-2">
                        {dateFmt.format(dueDate)}
                      </p>
                      <p className="text-meta text-text-secondary mt-1">
                        {isPastDue
                          ? "Deadline has passed"
                          : "Still accepting work"}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-border bg-surface-overlay/65 p-4">
                      <div className="flex items-center gap-2 text-label uppercase tracking-widest text-text-tertiary">
                        <Users size={14} aria-hidden="true" />
                        Groups
                      </div>
                      <p className="text-body font-semibold text-text-primary mt-2">
                        {assignment.group_count}
                      </p>
                      <p className="text-meta text-text-secondary mt-1">
                        Teams created so far
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-border bg-surface-overlay/65 p-4 col-span-2 lg:col-span-1">
                      <p className="text-label uppercase tracking-widest text-text-tertiary">
                        Submissions
                      </p>
                      <p className="text-body font-semibold text-text-primary mt-2">
                        {assignment.submitted_count}/
                        {assignment.total_submissions}
                      </p>
                      <p className="text-meta text-text-secondary mt-1">
                        Confirmed uploads
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-border bg-surface-raised/80 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-meta font-semibold text-text-primary">
                          Submission progress
                        </p>
                        <p className="text-meta text-text-secondary mt-1">
                          A quick read on how close this assignment is to
                          completion.
                        </p>
                      </div>
                      <span className="text-label text-text-tertiary">
                        {submissionRate}%
                      </span>
                    </div>
                    <div className="mt-4">
                      <ProgressBar
                        value={assignment.submitted_count}
                        max={Math.max(assignment.total_submissions, 1)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        navigate(`/admin/assignments/${assignment.id}/edit`)
                      }
                      className="btn-secondary btn-sm"
                    >
                      <Pencil size={14} aria-hidden="true" />
                      Edit details
                    </button>

                    <a
                      href={assignment.onedrive_link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary btn-sm"
                    >
                      <ExternalLink size={14} aria-hidden="true" />
                      Open folder
                    </a>

                    <button
                      onClick={() => handleCopyLink(assignment.onedrive_link)}
                      className="btn-secondary btn-sm"
                    >
                      <Copy size={14} aria-hidden="true" />
                      Copy link
                    </button>

                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="btn-danger btn-sm"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
