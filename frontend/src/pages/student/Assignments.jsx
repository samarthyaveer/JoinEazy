import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FileText from "lucide-react/dist/esm/icons/file-text";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import Users from "lucide-react/dist/esm/icons/users";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import PageShell from "@/components/layout/PageShell";
import {
  StatusBadge,
  EmptyState,
  Spinner,
  ProgressBar,
  StatCard,
} from "@/components/common/UIComponents";
import ErrorBanner from "@/components/common/ErrorBanner";
import { useStagger } from "@/hooks/useGsap";
import { studentApi } from "@/services/api";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function getDaysUntil(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function getAssignmentState(assignment) {
  const hasGroup = Boolean(assignment.my_group);
  const submission = assignment.my_submission;
  const myStatus = submission?.my_submission_status;
  const isPastDue = new Date(assignment.due_date) < new Date();

  if (!hasGroup) {
    return isPastDue
      ? {
          badge: "missing_deadline",
          title: "No group was created before the deadline",
          description: "Open the assignment to review the brief and talk to your professor if you still need to submit.",
          cta: "Review assignment",
        }
      : {
          badge: "needs_group",
          title: "Create your group to unlock submission",
          description: "Start with a group name, invite teammates, and the upload steps appear right away.",
          cta: "Create group",
        };
  }

  if (submission?.status === "submitted") {
    return {
      badge: "submitted",
      title: "Your group has submitted",
      description: "Everything is in and waiting for instructor review.",
      cta: "View details",
    };
  }

  if (myStatus === "submitted") {
    return {
      badge: "submitted_waiting",
      title: "You finished your part",
      description: "Your teammates still need to complete their confirmation steps.",
      cta: "Check progress",
    };
  }

  if (myStatus === "awaiting_confirmation") {
    return {
      badge: "awaiting_confirmation",
      title: "One final confirmation is left",
      description: "Open the assignment and confirm the title to finish your submission.",
      cta: "Confirm now",
    };
  }

  if (myStatus === "link_visited") {
    return {
      badge: "link_visited",
      title: "Upload started",
      description: "Your group has opened the folder. Mark the upload complete once the files are in place.",
      cta: "Finish upload",
    };
  }

  return {
    badge: "group_ready",
    title: "Your group is ready",
    description: "Open the assignment, upload your work, and move through the confirmation steps.",
    cta: "Open workspace",
  };
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cardsRef = useStagger({
    selector: "[data-assignment-card]",
    stagger: 0.06,
    y: 18,
    delay: 0.15,
  });

  const loadAssignments = useCallback(async () => {
    try {
      setError("");
      const { data } = await studentApi.getAssignments();
      setAssignments(data.assignments || []);
    } catch (err) {
      setError(err.message || "Couldn't load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const stats = useMemo(() => {
    const dueSoon = assignments.filter((assignment) => {
      const daysUntil = getDaysUntil(assignment.due_date);
      return daysUntil >= 0 && daysUntil <= 7 && assignment.my_submission?.status !== "submitted";
    }).length;

    const grouped = assignments.filter((assignment) => assignment.my_group).length;
    const submitted = assignments.filter(
      (assignment) => assignment.my_submission?.status === "submitted",
    ).length;

    return { dueSoon, grouped, submitted };
  }, [assignments]);

  if (loading) {
    return (
      <PageShell title="Assignments" subtitle="Loading your coursework">
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Assignments" subtitle="Your coursework workspace">
        <ErrorBanner message={error} onRetry={loadAssignments} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Assignments"
      subtitle="Everything you need is grouped by what needs action next."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Assigned work" value={assignments.length} />
        <StatCard label="Due this week" value={stats.dueSoon} />
        <StatCard
          label="Groups ready"
          value={stats.grouped}
          sublabel={`${stats.submitted} fully submitted`}
        />
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments yet"
          description="Once your professor posts work, it will show up here with group and submission guidance."
        />
      ) : (
        <div ref={cardsRef} className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {assignments.map((assignment) => {
            const state = getAssignmentState(assignment);
            const isPastDue = new Date(assignment.due_date) < new Date();
            const daysUntil = getDaysUntil(assignment.due_date);
            const memberCount = assignment.my_group?.member_count || 0;
            const submittedMembers = assignment.my_group?.submitted_members || 0;

            return (
              <article
                key={assignment.id}
                data-assignment-card
                className="card p-5 sm:p-6 content-auto"
              >
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <StatusBadge status={state.badge} />
                        {isPastDue ? <span className="badge-danger">Past due</span> : null}
                      </div>
                      <h2 className="text-section text-text-primary leading-tight">
                        {assignment.title}
                      </h2>
                      <p className="text-body text-text-secondary mt-2">
                        {assignment.description || "Open the assignment to review the instructions and submission steps."}
                      </p>
                    </div>

                    <Link
                      to={`/assignments/${assignment.id}`}
                      className="btn-primary btn-sm shrink-0"
                    >
                      {state.cta}
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="rounded-[24px] border border-black/6 bg-surface-overlay/65 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <p className="text-meta font-semibold text-text-primary">
                          {state.title}
                        </p>
                        <p className="text-meta text-text-secondary mt-1 max-w-2xl">
                          {state.description}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-black/6 bg-white/80 px-4 py-3 min-w-[190px]">
                        <div className="flex items-center gap-2 text-label uppercase tracking-widest text-text-tertiary">
                          <CalendarClock size={14} aria-hidden="true" />
                          Due
                        </div>
                        <p className="text-body font-semibold text-text-primary mt-2">
                          {dateFmt.format(new Date(assignment.due_date))}
                        </p>
                        <p className={`text-label mt-1 ${isPastDue ? "text-semantic-danger" : "text-text-tertiary"}`}>
                          {isPastDue
                            ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"} late`
                            : daysUntil === 0
                              ? "Due today"
                              : `${daysUntil} day${daysUntil === 1 ? "" : "s"} left`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-[22px] border border-black/6 bg-white/75 p-4">
                      <div className="flex items-center gap-2 text-label uppercase tracking-widest text-text-tertiary">
                        <Users size={14} aria-hidden="true" />
                        Group
                      </div>
                      <p className="text-body font-semibold text-text-primary mt-2">
                        {assignment.my_group?.name || "No group yet"}
                      </p>
                      <p className="text-meta text-text-secondary mt-1">
                        {assignment.my_group
                          ? `${memberCount}/${assignment.max_group_size} members joined`
                          : `Up to ${assignment.max_group_size} members`}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-black/6 bg-white/75 p-4">
                      <p className="text-label uppercase tracking-widest text-text-tertiary">
                        Team progress
                      </p>
                      {assignment.my_group ? (
                        <>
                          <div className="mt-3">
                            <ProgressBar value={submittedMembers} max={Math.max(memberCount, 1)} />
                          </div>
                          <p className="text-meta text-text-secondary mt-2">
                            {submittedMembers} of {memberCount} members have completed their submission steps.
                          </p>
                        </>
                      ) : (
                        <p className="text-meta text-text-secondary mt-3">
                          Once you form a group, this card tracks who has uploaded and confirmed.
                        </p>
                      )}
                    </div>
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
