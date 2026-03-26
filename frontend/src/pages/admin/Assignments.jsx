import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import { EmptyState, Spinner } from '../../components/common/UIComponents';
import api from '../../services/api';

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAssignments = async () => {
    try {
      const { data } = await api.get('/assignments');
      setAssignments(data.assignments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssignments(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment? This will also delete all groups and submissions.')) return;
    try {
      await api.delete(`/assignments/${id}`);
      await loadAssignments();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  if (loading) {
    return <PageShell title="Assignments"><div className="flex justify-center py-20"><Spinner /></div></PageShell>;
  }

  const isPastDue = (d) => new Date(d) < new Date();

  return (
    <PageShell
      title="Assignments"
      subtitle="Manage course assignments"
      action={<Link to="/admin/assignments/new" className="btn-primary text-sm">+ New Assignment</Link>}
    >
      {assignments.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No assignments created"
          description="Create an assignment to get started."
          action={<Link to="/admin/assignments/new" className="btn-primary text-xs">Create Assignment</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface-tertiary/50">
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Due Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Target</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Groups</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Submitted</th>
                <th className="px-4 py-2.5 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={isPastDue(a.due_date) ? 'text-status-danger' : 'text-text-secondary'}>
                      {new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-text-secondary">{a.target_type}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.group_count || 0}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.submitted_count || 0}/{a.total_submissions || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/assignments/${a.id}/edit`} className="btn-ghost text-xs px-2 py-1">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(a.id)} className="btn-ghost text-xs px-2 py-1 text-status-danger hover:text-red-700">
                        Delete
                      </button>
                    </div>
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
