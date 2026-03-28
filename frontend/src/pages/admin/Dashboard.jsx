import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import PageShell from '../../components/layout/PageShell';
import { StatCard, EmptyState, Spinner } from '../../components/common/UIComponents';
import { useStagger } from '../../hooks/useGsap';
import api from '../../services/api';

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const statsRef = useStagger({ stagger: 0.1, y: 30, delay: 0.15 });
  const tableRef = useStagger({ selector: 'tbody tr', stagger: 0.05, y: 16, delay: 0.3 });

  useEffect(() => {
    async function load() {
      try {
        const [overviewRes, listRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/assignments'),
        ]);
        setStats(overviewRes.data);
        setRecent((listRes.data.assignments || []).slice(0, 5));
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <PageShell title="Dashboard"><div className="flex justify-center py-20"><Spinner /></div></PageShell>;
  }

  return (
    <PageShell
      title="Dashboard"
      subtitle="Overview of your assignments and student progress"
      action={
        <Link to="/admin/assignments/new" className="btn-primary">
          <Plus size={16} aria-hidden="true" />
          New Assignment
        </Link>
      }
    >
      <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard label="Total Students" value={stats?.total_students || 0} />
        <StatCard label="Assignments" value={stats?.total_assignments || 0} />
        <StatCard label="Groups Formed" value={stats?.total_groups || 0} />
        <StatCard label="Submission Rate" value={`${stats?.submission_rate || 0}%`} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-section text-text-primary">Recent Assignments</h2>
          <Link to="/admin/assignments" className="text-meta text-accent font-medium hover:text-accent-hover transition-colors">
            View All
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No assignments created"
            description="Create your first assignment to get started."
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
                  <th className="px-6 py-3.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-overlay/50 transition-colors">
                    <td className="px-6 py-5 text-body font-medium text-text-primary">{a.title}</td>
                    <td className="px-6 py-5 text-meta text-text-secondary font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {dateFmt.format(new Date(a.due_date))}
                    </td>
                    <td className="px-6 py-5 font-mono text-meta text-text-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>{a.group_count || 0}</td>
                    <td className="px-6 py-5 font-mono text-meta text-text-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>{a.submitted_count || 0}/{a.total_submissions || 0}</td>
                    <td className="px-6 py-5 text-right">
                      <Link to={`/admin/analytics/${a.id}`} className="inline-flex items-center gap-1 text-meta text-text-secondary hover:text-accent transition-colors">
                        Details <ChevronRight size={14} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
