import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import { StatusBadge, EmptyState, Spinner } from '../../components/common/UIComponents';
import api from '../../services/api';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/assignments').then((res) => {
      setAssignments(res.data.assignments || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageShell title="Assignments"><div className="flex justify-center py-20"><Spinner /></div></PageShell>;
  }

  const now = new Date();
  const isPastDue = (d) => new Date(d) < now;

  return (
    <PageShell title="Assignments" subtitle="All assignments assigned to you">
      {assignments.length === 0 ? (
        <EmptyState icon="📋" title="No assignments yet" description="Your professor hasn't posted any assignments yet." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface-tertiary/50">
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Due Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.title}</p>
                    {a.description && (
                      <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{a.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${isPastDue(a.due_date) ? 'text-status-danger font-medium' : 'text-text-secondary'}`}>
                      {new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {isPastDue(a.due_date) && <span className="text-xs text-status-danger ml-1">(overdue)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.my_submission?.status || 'pending'} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/assignments/${a.id}`} className="btn-ghost text-xs px-2 py-1">
                      View →
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
