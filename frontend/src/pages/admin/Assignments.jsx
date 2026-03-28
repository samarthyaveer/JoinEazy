import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import PageShell from '@/components/layout/PageShell';
import { EmptyState, Spinner } from '@/components/common/UIComponents';
import { useStagger } from '@/hooks/useGsap';
import { adminApi } from '@/services/api';

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const tableRef = useStagger({ selector: 'tbody tr', stagger: 0.05, y: 16, delay: 0.2 });

  const loadAssignments = useCallback(() => {
    adminApi.getAssignments().then((res) => {
      setAssignments(res.data.assignments || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment? This will also remove all associated groups and submissions.')) return;
    try {
      await adminApi.deleteAssignment(id);
      loadAssignments();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) {
    return (
      <PageShell title="Assignments">
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Assignments"
      subtitle="Create and manage your assignments"
      action={
        <Link to="/admin/assignments/new" className="btn-primary w-full sm:w-auto mt-4 sm:mt-0">
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
          action={
            <Link to="/admin/assignments/new" className="btn-primary btn-sm mt-4">
              Create Assignment
            </Link>
          }
        />
      ) : (
        <div ref={tableRef} className="card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-surface-overlay/60">
                <th className="text-left px-4 py-3 text-label text-text-tertiary uppercase tracking-widest">Title</th>
                <th className="text-left px-4 py-3 text-label text-text-tertiary uppercase tracking-widest">Due Date</th>
                <th className="text-left px-4 py-3 text-label text-text-tertiary uppercase tracking-widest hidden sm:table-cell">Groups</th>
                <th className="text-left px-4 py-3 text-label text-text-tertiary uppercase tracking-widest hidden sm:table-cell">Submitted</th>
                <th className="px-4 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-surface-overlay/50 transition-colors">
                  <td className="px-4 py-4">
                    <Link to={`/admin/analytics/${a.id}`} className="text-body font-medium text-text-primary hover:text-accent transition-colors">
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-meta text-text-secondary font-mono tabular-nums">
                    {dateFmt.format(new Date(a.due_date))}
                  </td>
                  <td className="px-4 py-4 font-mono text-meta text-text-secondary tabular-nums hidden sm:table-cell">{a.group_count || 0}</td>
                  <td className="px-4 py-4 font-mono text-meta text-text-secondary tabular-nums hidden sm:table-cell">{a.submitted_count || 0}/{a.total_submissions || 0}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/assignments/${a.id}/edit`)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-overlay text-text-tertiary hover:text-text-primary transition-colors"
                        aria-label="Edit assignment"
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-semantic-danger/10 text-text-tertiary hover:text-semantic-danger transition-colors"
                        aria-label="Delete assignment"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                      <Link
                        to={`/admin/analytics/${a.id}`}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-overlay text-text-tertiary hover:text-text-primary transition-colors"
                        aria-label="View assignment details"
                      >
                        <ChevronRight size={16} aria-hidden="true" />
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
