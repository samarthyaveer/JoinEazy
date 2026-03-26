import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import { StatusBadge, StatCard, EmptyState, Spinner } from '../../components/common/UIComponents';
import api from '../../services/api';

export default function StudentDashboard() {
  const [groups, setGroups] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [grpRes, asgRes] = await Promise.all([
          api.get('/groups/my'),
          api.get('/assignments'),
        ]);
        setGroups(grpRes.data.groups || []);
        setAssignments(asgRes.data.assignments || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <PageShell title="Dashboard">
        <div className="flex justify-center py-20"><Spinner /></div>
      </PageShell>
    );
  }

  const upcoming = assignments
    .filter((a) => new Date(a.due_date) > new Date())
    .slice(0, 5);

  return (
    <PageShell title="Dashboard" subtitle="Your assignments and groups at a glance">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Active Assignments" value={assignments.length} />
        <StatCard label="My Groups" value={groups.length} />
        <StatCard
          label="Submitted"
          value={groups.filter((g) => g.submission_status === 'submitted').length}
          sublabel={`of ${groups.length} assignments`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming assignments */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Upcoming Deadlines</h2>
          {upcoming.length === 0 ? (
            <EmptyState icon="📅" title="No upcoming deadlines" description="All caught up!" />
          ) : (
            <div className="card divide-y">
              {upcoming.map((a) => (
                <Link
                  key={a.id}
                  to={`/assignments/${a.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Due {new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-xs text-text-tertiary ml-3">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My groups */}
        <div>
          <h2 className="text-sm font-semibold mb-3">My Groups</h2>
          {groups.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No groups yet"
              description="Create or join a group from the assignments page"
              action={
                <Link to="/assignments" className="btn-primary text-xs">View Assignments</Link>
              }
            />
          ) : (
            <div className="card divide-y">
              {groups.map((g) => (
                <Link
                  key={g.id}
                  to={`/assignments/${g.assignment_id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{g.name}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {g.assignment_title} · {g.member_count}/{g.max_group_size} members
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
