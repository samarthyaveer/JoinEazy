import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import { StatCard, ProgressBar, EmptyState, Spinner } from '../../components/common/UIComponents';
import api from '../../services/api';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ovRes, stRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/stats'),
        ]);
        setOverview(ovRes.data.overview);
        setStats(stRes.data.stats || []);
      } catch (err) {
        console.error(err);
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
      title="Professor Dashboard"
      subtitle="Overview of assignments, groups, and submissions"
      action={
        <Link to="/admin/assignments/new" className="btn-primary text-sm">
          + New Assignment
        </Link>
      }
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Students" value={overview?.totalStudents || 0} />
        <StatCard label="Assignments" value={overview?.totalAssignments || 0} />
        <StatCard label="Groups" value={overview?.totalGroups || 0} />
        <StatCard
          label="Submission Rate"
          value={`${overview?.submissionRate || 0}%`}
          sublabel={`${overview?.totalSubmitted || 0} of ${overview?.totalSubmissions || 0}`}
        />
      </div>

      {/* Assignment overview table */}
      <h2 className="text-sm font-semibold mb-3">Assignment Overview</h2>
      {stats.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No assignments yet"
          description="Create your first assignment to get started."
          action={<Link to="/admin/assignments/new" className="btn-primary text-xs">Create Assignment</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface-tertiary/50">
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Assignment</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Due Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Groups</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider w-48">Completion</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.map((s) => {
                const total = parseInt(s.total_submissions) || 0;
                const submitted = parseInt(s.submitted_count) || 0;
                return (
                  <tr key={s.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 font-medium">{s.title}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {new Date(s.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{s.group_count}</td>
                    <td className="px-4 py-3">
                      <ProgressBar value={submitted} max={total || 1} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/analytics/${s.id}`} className="btn-ghost text-xs px-2 py-1">
                        Details →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
