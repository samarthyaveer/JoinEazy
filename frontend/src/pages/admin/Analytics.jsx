import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageShell from '../../components/layout/PageShell';
import { RagDot, StatCard, EmptyState, Spinner } from '../../components/common/UIComponents';
import api from '../../services/api';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'; // Need nice icons, or use plain HTML if not installed. Let's use simple SVG

const ChevronDown = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
);
const ChevronUp = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
);

const GroupRow = ({ g, setEvalModal }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr onClick={() => setExpanded(!expanded)} className="hover:bg-surface-hover transition-colors cursor-pointer group">
        <td className="px-4 py-2.5">
          <button className="text-text-tertiary group-hover:text-text-primary transition-colors">
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </button>
        </td>
        <td className="px-4 py-2.5 whitespace-nowrap"><RagDot status={g.rag_status} /></td>
        <td className="px-4 py-2.5 font-medium">{g.name}</td>
        <td className="px-4 py-2.5 text-text-secondary">{g.leader_name}</td>
        <td className="px-4 py-2.5 font-mono text-xs">{g.member_count}</td>
        <td className="px-4 py-2.5 capitalize text-xs">
          {g.submission_status?.replace(/_/g, ' ') || 'pending'}
        </td>
        <td className="px-4 py-2.5 text-text-tertiary text-xs whitespace-nowrap">
          {g.confirmed_at
            ? new Date(g.confirmed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            : '—'}
        </td>
        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
          {g.submission_status === 'submitted' ? (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${g.evaluation_status === 'accepted' ? 'bg-green-100 text-green-700' : g.evaluation_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-600'}`}>
                {g.evaluation_status || 'ungraded'}
              </span>
              <button 
                onClick={() => setEvalModal({ isOpen: true, submissionId: g.submission_id, groupName: g.name, status: g.evaluation_status !== 'ungraded' ? g.evaluation_status : 'accepted', feedback: g.feedback || '', userId: null, targetName: 'Whole Group', submitting: false })}
                className="text-brand-600 hover:text-brand-700 text-xs font-medium whitespace-nowrap border border-brand-200 px-2 py-0.5 rounded-md hover:bg-brand-50 transition-colors"
                title="Evaluate entire group"
              >
                Eval Group
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-text-tertiary">N/A</span>
          )}
        </td>
      </tr>
      
      {expanded && (
        <tr className="bg-zinc-50/50">
          <td colSpan="8" className="px-0 py-0 border-b">
            <div className="pl-14 pr-4 py-3 border-l-2 border-brand-400">
              <h4 className="text-xs font-semibold mb-2 text-text-secondary uppercase">Individual Progress & Feedback</h4>
              <div className="space-y-2">
                {g.members?.map(m => (
                  <div key={m.user_id} className="flex items-center justify-between p-2 bg-white rounded-md border border-border shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-text-secondary">
                        {m.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{m.full_name} {m.role === 'leader' && <span className="text-[10px] text-brand-600 ml-1 font-semibold">(Lead)</span>}</p>
                        <p className="text-xs text-text-tertiary mt-0.5">{m.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Step Status Badge */}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize border ${
                        m.submission_status === 'submitted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        m.submission_status === 'pending' ? 'bg-zinc-50 text-zinc-500 border-zinc-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        Step: {m.submission_status?.replace(/_/g, ' ')}
                      </span>
                      
                      {/* Evaluation Badge (If Group is Submitted) */}
                      {g.submission_status === 'submitted' && (
                        <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${m.evaluation_status === 'accepted' ? 'bg-green-100 text-green-700' : m.evaluation_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                              {m.evaluation_status || 'ungraded'}
                           </span>
                           <button 
                             onClick={() => setEvalModal({ isOpen: true, submissionId: g.submission_id, groupName: g.name, status: m.evaluation_status !== 'ungraded' ? m.evaluation_status : 'accepted', feedback: m.feedback || '', userId: m.user_id, targetName: m.full_name, submitting: false })}
                             className="text-brand-600 hover:text-brand-700 text-[10px] font-medium whitespace-nowrap underline"
                           >
                             Eval Student
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!g.members || g.members.length === 0) && <p className="text-xs text-text-tertiary">No members found.</p>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default function Analytics() {

  const [evalModal, setEvalModal] = useState({ isOpen: false, submissionId: null, groupName: '', targetName: '', userId: null, status: 'accepted', feedback: '', submitting: false });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
  }, [id, refreshTrigger]);

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setEvalModal(p => ({ ...p, submitting: true }));
    try {
      await api.post(`/submissions/${evalModal.submissionId}/review`, {
        evaluationStatus: evalModal.status,
        feedback: evalModal.feedback,
        userId: evalModal.userId
      });
      setEvalModal({ isOpen: false, submissionId: null, groupName: '', targetName: '', userId: null, status: 'accepted', feedback: '', submitting: false });
      setRefreshTrigger(p => p + 1); // reload data
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit evaluation');
      setEvalModal(p => ({ ...p, submitting: false }));
    }
  };

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
                      <th className="text-left px-4 py-2 w-8"></th>
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider w-8">⬤</th>
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider">Group</th>
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider">Leader</th>
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider">Members</th>
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider">Submitted At</th>
                      <th className="text-left px-4 py-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider">Evaluate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {groups.map((g) => (
                      <GroupRow key={g.id} g={g} setEvalModal={setEvalModal} />
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

        {/* Evaluation Modal */}
        {evalModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-1">Evaluate {evalModal.targetName === 'Whole Group' ? 'Group Submission' : 'Individual'}</h2>
              <div className="text-sm text-text-secondary mb-4 space-y-1">
                <p>Group: <span className="font-semibold text-text-primary">{evalModal.groupName}</span></p>
                <p>Target: <span className="font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 mt-1 rounded inline-block">{evalModal.targetName}</span></p>
              </div>
              
              <form onSubmit={handleEvaluate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Action</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setEvalModal(p => ({ ...p, status: 'accepted' }))} className={`px-3 py-2 text-sm rounded-md border transition-colors ${evalModal.status === 'accepted' ? 'border-green-500 bg-green-50 text-green-700 font-medium' : 'border-border text-text-secondary hover:bg-surface-hover'}`}>Accept</button>
                    <button type="button" onClick={() => setEvalModal(p => ({ ...p, status: 'rejected' }))} className={`px-3 py-2 text-sm rounded-md border transition-colors ${evalModal.status === 'rejected' ? 'border-red-500 bg-red-50 text-red-700 font-medium' : 'border-border text-text-secondary hover:bg-surface-hover'}`}>Reject</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Feedback (Optional)</label>
                  <textarea
                    className="input-field min-h-[100px]"
                    placeholder="Provide feedback to the students..."
                    value={evalModal.feedback}
                    onChange={(e) => setEvalModal(p => ({ ...p, feedback: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setEvalModal(p => ({ ...p, isOpen: false }))} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={evalModal.submitting}>
                    {evalModal.submitting ? 'Saving...' : 'Save Evaluation'}
                  </button>
                </div>
              </form>
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
