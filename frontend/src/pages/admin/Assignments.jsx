import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import PageShell from '../../components/layout/PageShell';
import { EmptyState, Spinner } from '../../components/common/UIComponents';
import { useStagger } from '../../hooks/useGsap';
import api from '../../services/api';

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const tableRef = useStagger({ selector: 'tbody tr', stagger: 0.05, y: 16, delay: 0.2 });

  const loadAssignments = useCallback(() => {
    api.get('/assignments').then((res) => {
      setAssignments(res.data.assignments || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment? This will also remove all associated groups and submissions.')) return;
    try {
      await api.delete(`/assignments/${id}`);
      loadAssignments();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) {
    return <PageShell title="Assignments"><div className="flex justify-center py-20"><Spinner /></div></PageShell>;
  }

  return (
    <PageShell
      title="Assignments"
      subtitle="Create and manage your assignments"
      action={
        <Link to="/admin/assignments/new" className="btn-primary">
          <Plus size={16} aria-hidden="true" />
          New Assignment
        </Link>
      }
    >
      {assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments yet"
          description="Create your first assignment for students."
          action={<Link to="/admin/assignments/new" className="btn-primary btn-sm">Create Assignment</Link>}
        />
      ) : (
        <div ref={tableRef} className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-overlay/60">
                <th className="text-left px-6 py-3.5 text-label text-text-tertiary uppercase tracking-widest">Title</th>
                <th className="text-left px-6 py-3.5 text-label text-text-tertiary uppercase tracking-widest">Due Date</th>
                <th className="text-left px-6 py-3.5 text-label text-text-tertiary uppercase tracking-widest">Groups</th>
                <th className="text-left px-6 py-3.5 text-label text-text-tertiary uppercase tracking-widest">Submitted</th>
                <th className="px-6 py-3.5 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-surface-overlay/50 transition-colors">
                  <td className="px-6 py-5">
                    <Link to={`/admin/analytics/${a.id}`} className="text-body font-medium text-text-primary hover:text-accent transition-colors">
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-6 py-5 text-meta text-text-secondary font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {dateFmt.format(new Date(a.due_date))}
                  </td>
                  <td className="px-6 py-5 font-mono text-meta text-text-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>{a.group_count || 0}</td>
                  <td className="px-6 py-5 font-mono text-meta text-text-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>{a.submitted_count || 0}/{a.total_submissions || 0}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/admin/assignments/${a.id}/edit`)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-overlay text-text-tertiary hover:text-text-primary transition-colors"
                        aria-label="Edit assignment"
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-semantic-danger/8 text-text-tertiary hover:text-semantic-danger transition-colors"
                        aria-label="Delete assignment"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                      <Link
                        to={`/admin/analytics/${a.id}`}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-overlay text-text-tertiary hover:text-text-primary transition-colors"
                        aria-label="View assignment details"
                      >
                        <ChevronRight size={14} aria-hidden="true" />
                      </Link>
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
