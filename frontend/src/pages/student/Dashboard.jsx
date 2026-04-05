import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Users from "lucide-react/dist/esm/icons/users";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import PageShell from "@/components/layout/PageShell";
import {
  StatusBadge,
  StatCard,
  EmptyState,
  Spinner,
} from "@/components/common/UIComponents";
import { usePageReady } from "@/context/InitialLoadContext";
import { useStagger } from "@/hooks/useGsap";
import { studentApi } from "@/services/api";

export default function StudentDashboard() {
  const [groups, setGroups] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  usePageReady(!loading);

  const statsRef = useStagger({ stagger: 0.1, y: 30, delay: 0.15 });
  const upcomingRef = useStagger({
    selector: ":scope > a",
    stagger: 0.06,
    y: 20,
    delay: 0.3,
  });
  const groupsRef = useStagger({
    selector: ":scope > a",
    stagger: 0.06,
    y: 20,
    delay: 0.4,
  });

  useEffect(() => {
    async function load() {
      try {
        const [grpRes, asgRes] = await Promise.all([
          studentApi.getMyGroups(),
          studentApi.getAssignments(),
        ]);
        setGroups(grpRes.data.groups || []);
        setAssignments(asgRes.data.assignments || []);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <PageShell title="Overview">
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  const upcoming = assignments
    .filter((a) => new Date(a.due_date) > new Date())
    .slice(0, 5);

  const submittedCount = groups.reduce(
    (acc, g) => acc + (g.submission_status === "submitted" ? 1 : 0),
    0,
  );

  return (
    <PageShell title="Overview" subtitle="Assignments and groups">
      <div
        ref={statsRef}
        className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <StatCard label="Active work" value={assignments.length} />
        <StatCard label="My groups" value={groups.length} />
        <StatCard
          className="col-span-2 xl:col-span-1"
          label="Submitted groups"
          value={submittedCount}
          sublabel={`of ${groups.length} groups`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
        <div>
          <h2 className="text-section text-text-primary mb-4 sm:mb-5">
            Due soon
          </h2>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nothing due soon"
              description="You're all set."
            />
          ) : (
            <div ref={upcomingRef} className="card divide-y divide-border">
              {upcoming.map((a) => (
                <Link
                  key={a.id}
                  to={`/assignments/${a.id}`}
                  className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 hover:bg-surface-overlay transition-colors first:rounded-t-card last:rounded-b-card"
                >
                  <div className="min-w-0">
                    <p className="text-body font-medium text-text-primary truncate">
                      {a.title}
                    </p>
                    <p className="text-meta text-text-secondary mt-1">
                      Due on{" "}
                      {new Intl.DateTimeFormat("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(a.due_date))}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-text-tertiary ml-4 flex-shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Groups */}
        <div>
          <h2 className="text-section text-text-primary mb-4 sm:mb-5">
            My groups
          </h2>
          {groups.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No groups"
              description="Create or join one from assignments."
              action={
                <Link to="/assignments" className="btn-primary btn-sm mt-4">
                  View assignments
                </Link>
              }
            />
          ) : (
            <div ref={groupsRef} className="card divide-y divide-border">
              {groups.map((g) => (
                <Link
                  key={g.id}
                  to={`/assignments/${g.assignment_id}`}
                  className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 hover:bg-surface-overlay transition-colors first:rounded-t-card last:rounded-b-card"
                >
                  <div className="min-w-0">
                    <p className="text-body font-medium text-text-primary truncate">
                      {g.name}
                    </p>
                    <p className="text-meta text-text-secondary mt-1">
                      {g.assignment_title} ·{" "}
                      <span className="font-mono tabular-nums">
                        {g.member_count}/{g.max_group_size}
                      </span>{" "}
                      members total
                    </p>
                  </div>
                  <StatusBadge status={g.submission_status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
