import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageShell from '../../components/layout/PageShell';
import { RagDot, StatCard, EmptyState, Spinner } from '../../components/common/UIComponents';
import api from '../../services/api';

export default function Analytics() {
  const { id } = useParams();
  const [allStats, setAllStats] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/analytics/assignments/${id}`).then(({ data }) => {
        setAnalytics(data.analytics);
      }).catch(console.error).finally(() => setLoading(false));
    } else {
      api.get('/analytics/stats').then(({ data }) => {
        setAllStats(data.stats || []);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <PageShell title="Analytics"><div className="flex justify-center py-20"><Spinner /></div></PageShell>;
  }

  // Assignment-specific view
  if (id && analytics) {
    const { assignment, groups, ungroupedStudents, summary } = analytics;
    const ragColors = { green: '#10B981', amber: '#F59E0B', red: '#EF4444' };

    const chartData = [
      { name: 'Submitted', value: summary.submitted, color: ragColors.green },
      { name: 'In Progress', value: summary.inProgress, color: ragColors.amber },
      { name: 'At Risk', value: summary.atRisk, color: ragColors.red },
    ];

    return (
      <PageShell
        title={assignment.title}
        subtitle="Submission analytics and group tracking"
      >
        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Groups" value={summary.totalGroups} />
          <StatCard label="Submitted" value={summary.submitted} />
          <StatCard label="In Progress" value={summary.inProgress} />
          <StatCard label="At Risk" value={summary.atRisk} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-1 card p-4">
            <h3 className="text-sm font-semibold mb-4">Status Distribution</h3>
            {summary.totalGroups > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #E4E4E7',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-text-tertiary text-center py-8">No groups to display</p>
            )}
          </div>

          {/* Group breakdown table */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold mb-3">Group Breakdown</h3>
            {groups.length === 0 ? (
              <EmptyState icon="👥" title="No groups formed yet" />
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-surface-tertiary/50">
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-xs uppercase tracking-wider w-8">⬤</th>
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-xs uppercase tracking-wider">Group</th>
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-xs uppercase tracking-wider">Leader</th>
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-xs uppercase tracking-wider">Members</th>
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-xs uppercase tracking-wider">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {groups.map((g) => (
                      <tr key={g.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-2.5"><RagDot status={g.rag_status} /></td>
                        <td className="px-4 py-2.5 font-medium">{g.name}</td>
                        <td className="px-4 py-2.5 text-text-secondary">{g.leader_name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{g.member_count}</td>
                        <td className="px-4 py-2.5 capitalize text-xs">
                          {g.submission_status?.replace(/_/g, ' ') || 'pending'}
                        </td>
                        <td className="px-4 py-2.5 text-text-tertiary text-xs">
                          {g.confirmed_at
                            ? new Date(g.confirmed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Ungrouped students */}
        {ungroupedStudents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3 text-status-danger">
              ⚠ Students Without a Group ({ungroupedStudents.length})
            </h3>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-red-50/50">
                    <th className="text-left px-4 py-2 font-medium text-red-700 text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-2 font-medium text-red-700 text-xs uppercase tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ungroupedStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-red-50/30">
                      <td className="px-4 py-2.5">{s.full_name}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageShell>
    );
  }

  // All assignments analytics overview
  return (
    <PageShell title="Analytics" subtitle="Submission tracking across all assignments">
      {allStats.length === 0 ? (
        <EmptyState icon="📊" title="No data yet" description="Create assignments to see analytics." />
      ) : (
        <div className="space-y-3">
          {allStats.map((s) => {
            const total = parseInt(s.total_submissions) || 0;
            const submitted = parseInt(s.submitted_count) || 0;
            const inProgress = parseInt(s.in_progress_count) || 0;
            const pending = parseInt(s.pending_count) || 0;

            return (
              <Link
                key={s.id}
                to={`/admin/analytics/${s.id}`}
                className="card p-4 flex items-center justify-between hover:bg-surface-hover transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Due {new Date(s.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' · '}{s.group_count} groups
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><RagDot status="green" /> {submitted}</span>
                  <span className="flex items-center gap-1.5"><RagDot status="amber" /> {inProgress}</span>
                  <span className="flex items-center gap-1.5"><RagDot status="red" /> {pending}</span>
                  <span className="text-text-tertiary">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
