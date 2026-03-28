import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Users from "lucide-react/dist/esm/icons/users";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import PageShell from "@/components/layout/PageShell";
import {
  StatusBadge,
  EmptyState,
  Spinner,
} from "@/components/common/UIComponents";
import { useStagger } from "@/hooks/useGsap";
import { studentApi } from "@/services/api";

export default function MyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const tableRef = useStagger({
    selector: "tbody tr",
    stagger: 0.05,
    y: 16,
    delay: 0.2,
  });

  useEffect(() => {
    studentApi
      .getMyGroups()
      .then((res) => {
        setGroups(res.data.groups || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageShell title="My Groups">
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="My Groups" subtitle="Groups you've created or joined">
      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="You're not in any groups"
          description="Go to an assignment and create a group to get started."
          action={
            <Link to="/assignments" className="btn-primary btn-sm">
              Browse Assignments
            </Link>
          }
        />
      ) : (
        <div ref={tableRef} className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-overlay/60">
                <th className="text-left px-6 py-3.5 text-label text-text-tertiary uppercase tracking-widest">
                  Group
                </th>
                <th className="text-left px-6 py-3.5 text-label text-text-tertiary uppercase tracking-widest">
                  Assignment
                </th>
                <th className="text-left px-6 py-3.5 text-label text-text-tertiary uppercase tracking-widest">
                  Members
                </th>
                <th className="text-left px-6 py-3.5 text-label text-text-tertiary uppercase tracking-widest">
                  Role
                </th>
                <th className="text-left px-6 py-3.5 text-label text-text-tertiary uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-3.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map((g) => (
                <tr
                  key={g.id}
                  className="hover:bg-surface-overlay/50 transition-colors"
                >
                  <td className="px-6 py-5 text-body font-medium text-text-primary">
                    {g.name}
                  </td>
                  <td className="px-6 py-5 text-meta text-text-secondary">
                    {g.assignment_title}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className="font-mono text-meta text-text-secondary"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {g.member_count}/{g.max_group_size}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`text-meta font-medium capitalize ${g.my_role === "leader" ? "text-accent" : "text-text-secondary"}`}
                    >
                      {g.my_role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={g.submission_status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link
                      to={`/assignments/${g.assignment_id}`}
                      className="inline-flex items-center gap-1 text-meta text-text-secondary hover:text-accent transition-colors"
                    >
                      View <ChevronRight size={14} aria-hidden="true" />
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
