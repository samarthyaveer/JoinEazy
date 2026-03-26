import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import { StatusBadge, EmptyState, Spinner } from '../../components/common/UIComponents';
import api from '../../services/api';

export default function MyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/groups/my').then((res) => {
      setGroups(res.data.groups || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageShell title="My Groups"><div className="flex justify-center py-20"><Spinner /></div></PageShell>;
  }

  return (
    <PageShell title="My Groups" subtitle="Groups you've created or joined">
      {groups.length === 0 ? (
        <EmptyState
          icon="👥"
          title="You're not in any groups"
          description="Go to an assignment and create a group to get started."
          action={<Link to="/assignments" className="btn-primary text-xs">Browse Assignments</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface-tertiary/50">
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Group</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Assignment</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Members</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3 font-medium">{g.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{g.assignment_title}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{g.member_count}/{g.max_group_size}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium capitalize ${g.my_role === 'leader' ? 'text-brand-600' : 'text-text-secondary'}`}>
                      {g.my_role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={g.submission_status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/assignments/${g.assignment_id}`} className="btn-ghost text-xs px-2 py-1">
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
