import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import FileText from "lucide-react/dist/esm/icons/file-text";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import PageShell from "@/components/layout/PageShell";
import {
  StatusBadge,
  EmptyState,
  Spinner,
} from "@/components/common/UIComponents";
import { useStagger } from "@/hooks/useGsap";
import { studentApi } from "@/services/api";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const tableRef = useStagger({
    selector: "tbody tr",
    stagger: 0.05,
    y: 16,
    delay: 0.2,
  });

  useEffect(() => {
    studentApi
      .getAssignments()
      .then((res) => {
        setAssignments(res.data.assignments || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageShell title="Assignments">
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  const now = new Date();
  const isPastDue = (d) => new Date(d) < now;

  return (
    <PageShell title="Assignments" subtitle="All assignments assigned to you">
      {assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments yet"
          description="Your professor hasn't posted any assignments yet."
        />
      ) : (
        <div ref={tableRef} className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-surface-overlay/60">
                <th className="text-left px-4 py-3 text-label text-text-tertiary uppercase tracking-widest">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-label text-text-tertiary uppercase tracking-widest hidden sm:table-cell">
                  Due Date
                </th>
                <th className="text-left px-4 py-3 text-label text-text-tertiary uppercase tracking-widest">
                  Status
                </th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignments.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-surface-overlay/50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <p className="text-body font-medium text-text-primary">
                      {a.title}
                    </p>
                    {a.description ? (
                      <p className="text-meta text-text-secondary mt-0.5 line-clamp-1">
                        {a.description}
                      </p>
                    ) : null}
                    {/* Show due date on mobile only */}
                    <div className="sm:hidden mt-1 flex items-center">
                      <span
                        className={`text-meta font-mono tabular-nums ${isPastDue(a.due_date) ? "text-semantic-danger font-medium" : "text-text-secondary"}`}
                      >
                        {dateFmt.format(new Date(a.due_date))}
                      </span>
                      {isPastDue(a.due_date) ? (
                        <span className="text-label text-semantic-danger ml-1.5">
                          (overdue)
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span
                      className={`text-meta font-mono tabular-nums ${isPastDue(a.due_date) ? "text-semantic-danger font-medium" : "text-text-secondary"}`}
                    >
                      {dateFmt.format(new Date(a.due_date))}
                    </span>
                    {isPastDue(a.due_date) ? (
                      <span className="text-label text-semantic-danger ml-1.5">
                        (overdue)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      status={a.my_submission?.status || "pending"}
                    />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      to={`/assignments/${a.id}`}
                      className="inline-flex items-center gap-1 text-meta text-text-secondary hover:text-accent transition-colors"
                    >
                      View{" "}
                      <ChevronRight
                        size={14}
                        className="hidden sm:block"
                        aria-hidden="true"
                      />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
