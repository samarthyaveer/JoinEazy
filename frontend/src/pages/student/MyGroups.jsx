import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Users from "lucide-react/dist/esm/icons/users";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import PageShell from "@/components/layout/PageShell";
import {
  StatusBadge,
  EmptyState,
  Spinner,
  ProgressBar,
} from "@/components/common/UIComponents";
import ErrorBanner from "@/components/common/ErrorBanner";
import { useStagger } from "@/hooks/useGsap";
import { studentApi } from "@/services/api";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function MyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cardsRef = useStagger({
    selector: "[data-group-card]",
    stagger: 0.06,
    y: 18,
    delay: 0.15,
  });

  const loadGroups = useCallback(async () => {
    try {
      setError("");
      const { data } = await studentApi.getMyGroups();
      setGroups(data.groups || []);
    } catch (err) {
      setError(err.message || "Couldn't load your groups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  if (loading) {
    return (
      <PageShell title="My groups" subtitle="Loading your teams">
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="My groups" subtitle="Teams you joined or created">
        <ErrorBanner message={error} onRetry={loadGroups} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="My groups"
      subtitle="A compact view of every team, member count, and submission status."
    >
      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Open an assignment, create a team, and it will start showing live progress here."
          action={
            <Link to="/assignments" className="btn-primary btn-sm">
              Browse assignments
            </Link>
          }
        />
      ) : (
        <div
          ref={cardsRef}
          className="grid grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-5"
        >
          {groups.map((group) => (
            <article
              key={group.id}
              data-group-card
              className="card p-4 sm:p-5 lg:p-6"
            >
              <div className="flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <StatusBadge status={group.submission_status} />
                      <span
                        className={`badge ${group.my_role === "leader" ? "badge-success" : "badge-neutral"}`}
                      >
                        {group.my_role}
                      </span>
                    </div>
                    <h2 className="text-section text-text-primary">
                      {group.name}
                    </h2>
                    <p className="text-body text-text-secondary mt-2">
                      {group.assignment_title}
                    </p>
                  </div>

                  <Link
                    to={`/assignments/${group.assignment_id}`}
                    className="btn-secondary btn-sm shrink-0"
                  >
                    Open workspace
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="rounded-[22px] border border-border bg-surface-overlay/65 p-4">
                    <p className="text-label uppercase tracking-widest text-text-tertiary">
                      Team size
                    </p>
                    <p className="text-body font-semibold text-text-primary mt-2">
                      {group.member_count}/{group.max_group_size}
                    </p>
                    <p className="text-meta text-text-secondary mt-1">
                      Members in place
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-border bg-surface-overlay/65 p-4">
                    <div className="flex items-center gap-2 text-label uppercase tracking-widest text-text-tertiary">
                      <CalendarClock size={14} aria-hidden="true" />
                      Due
                    </div>
                    <p className="text-body font-semibold text-text-primary mt-2">
                      {dateFmt.format(new Date(group.due_date))}
                    </p>
                    <p className="text-meta text-text-secondary mt-1">
                      Keep the team on track
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-border bg-surface-overlay/65 p-4 col-span-2 lg:col-span-1">
                    <p className="text-label uppercase tracking-widest text-text-tertiary">
                      Your role
                    </p>
                    <p className="text-body font-semibold text-text-primary mt-2 capitalize">
                      {group.my_role}
                    </p>
                    <p className="text-meta text-text-secondary mt-1">
                      {group.my_role === "leader"
                        ? "You can manage members."
                        : "Follow the group updates."}
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-border bg-surface-raised/80 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-meta font-semibold text-text-primary">
                        Seat progress
                      </p>
                      <p className="text-meta text-text-secondary mt-1">
                        Track how close the team is to full capacity.
                      </p>
                    </div>
                    <span className="text-label text-text-tertiary">
                      {group.member_count}/{group.max_group_size}
                    </span>
                  </div>
                  <div className="mt-4">
                    <ProgressBar
                      value={group.member_count}
                      max={Math.max(group.max_group_size, 1)}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
