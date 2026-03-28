import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Users from 'lucide-react/dist/esm/icons/users';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import PageShell from '@/components/layout/PageShell';
import Modal from '@/components/common/Modal';
import { RagDot, StatCard, EmptyState, Spinner } from '@/components/common/UIComponents';
import { adminApi } from '@/services/api';

// Hoisted for dark chart
const tooltipStyle = {
  background: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  fontSize: '12px',
  color: '#0F0F0F',
};
const xAxisTick = { fontSize: 11, fill: '#A0A0A0' };
const yAxisTick = { fontSize: 11, fill: '#A0A0A0' };
const axisLineStyle = { stroke: 'rgba(0,0,0,0.06)' };

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

function GroupRow({ group, onEvaluate }) {
  const [expanded, setExpanded] = useState(false);

  const memberCount = group.members?.length || 0;
  const submittedCount = group.members?.reduce(
    (acc, m) => acc + (m.submission_status === 'submitted' ? 1 : 0),
    0
  ) || 0;
  const ragStatus = submittedCount === memberCount ? 'green' : submittedCount > 0 ? 'amber' : 'red';

  return (
    <>
      <tr
        className="hover:bg-surface-overlay/50 transition-colors cursor-pointer"
        onClick={() => setExpanded(prev => !prev)}
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <RagDot status={ragStatus} />
            <span className="text-body font-medium text-text-primary">{group.name}</span>
          </div>
        </td>
        <td className="px-5 py-4 font-mono text-meta text-text-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {submittedCount}/{memberCount}
        </td>
        <td className="px-5 py-4">
          <span className={`badge ${
            group.evaluation_status === 'accepted' ? 'badge-success' :
            group.evaluation_status === 'rejected' ? 'badge-danger' :
            'badge-neutral'
          } capitalize`}>
            {group.evaluation_status || 'ungraded'}
          </span>
        </td>
        <td className="px-5 py-4 text-right text-text-tertiary">
          {expanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </td>
      </tr>

      {expanded ? (
        <>
          {group.members?.map((m) => (
            <tr key={m.user_id} className="bg-surface-overlay/30">
              <td className="px-5 py-3 pl-10">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-surface-overlay flex items-center justify-center text-label font-medium text-text-secondary">
                    {m.full_name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-meta font-medium text-text-primary truncate">{m.full_name}</p>
                    <p className="text-label text-text-tertiary truncate">{m.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3">
                <span className={`text-label font-medium capitalize ${
                  m.submission_status === 'submitted' ? 'text-semantic-success' :
                  m.submission_status === 'pending' ? 'text-text-tertiary' :
                  'text-semantic-warning'
                }`}>
                  {m.submission_status?.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-5 py-3">
                <span className={`badge ${
                  m.evaluation_status === 'accepted' ? 'badge-success' :
                  m.evaluation_status === 'rejected' ? 'badge-danger' :
                  'badge-neutral'
                } capitalize`}>
                  {m.evaluation_status || 'ungraded'}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={(e) => { e.stopPropagation(); onEvaluate(group, m); }}
                  className="text-meta text-accent hover:text-accent-hover font-medium transition-colors"
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
          <tr className="bg-surface-overlay/30 border-b border-border">
            <td colSpan={4} className="px-5 py-3 pl-10">
              <button
                onClick={(e) => { e.stopPropagation(); onEvaluate(group, null); }}
                className="text-meta text-accent-text hover:text-accent-hover font-medium transition-colors"
              >
                Review Entire Group
              </button>
            </td>
          </tr>
        </>
      ) : null}
    </>
  );
}

const INITIAL_EVAL_MODAL = {
  isOpen: false, submissionId: null, groupName: '', targetName: '', userId: null,
  status: 'accepted', feedback: '', submitting: false,
};

export default function Analytics() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [allStats, setAllStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evalModal, setEvalModal] = useState(INITIAL_EVAL_MODAL);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        if (id) {
          const { data } = await adminApi.getAnalyticsAssignment(id);
          setAnalytics(data);
        } else {
          const { data } = await adminApi.getAnalyticsStats();
          setAllStats(data.stats || []);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, refreshTrigger]);

  const handleEvaluate = useCallback((group, member) => {
    setEvalModal({
      isOpen: true,
      submissionId: group.submission_id,
      groupName: group.name,
      targetName: member ? member.full_name : `Group: ${group.name}`,
      userId: member?.user_id || null,
      status: 'accepted',
      feedback: '',
      submitting: false,
    });
  }, []);

  const closeModal = useCallback(() => {
    setEvalModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const submitEvaluation = async (e) => {
    e.preventDefault();
    setEvalModal(prev => ({ ...prev, submitting: true }));
    try {
      const payload = { status: evalModal.status, feedback: evalModal.feedback };
      if (evalModal.userId) payload.userId = evalModal.userId;
      await adminApi.reviewSubmission(evalModal.submissionId, payload);
      setEvalModal(prev => ({ ...prev, isOpen: false }));
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Review failed:', err);
      setEvalModal(prev => ({ ...prev, submitting: false }));
    }
  };

  if (loading) {
    return <PageShell title="Analytics"><div className="flex justify-center py-20"><Spinner /></div></PageShell>;
  }

  if (id && analytics) {
    const { assignment, groups = [], ungrouped_students: ungroupedStudents = [] } = analytics;
    const totalGroups = groups.length;
    const submittedGroups = groups.reduce(
      (acc, g) => acc + (g.submission_status === 'submitted' ? 1 : 0),
      0
    );

    return (
      <PageShell
        title={assignment.title}
        subtitle={`Due ${dateFmt.format(new Date(assignment.due_date))}`}
        action={
          <Link to="/admin/analytics" className="btn-secondary btn-sm">
            <ArrowLeft size={14} aria-hidden="true" />
            All Analytics
          </Link>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Groups" value={totalGroups} />
          <StatCard label="Submitted" value={submittedGroups} sublabel={`of ${totalGroups} groups`} />
          <StatCard label="Completion" value={totalGroups > 0 ? `${Math.round((submittedGroups / totalGroups) * 100)}%` : '0%'} />
          <StatCard label="Ungrouped" value={ungroupedStudents.length} sublabel="students" />
        </div>

        {groups.length === 0 ? (
          <EmptyState icon={Users} title="No groups formed yet" />
        ) : (
          <div className="card overflow-hidden mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-overlay/50">
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">Group</th>
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">Submitted</th>
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">Evaluation</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groups.map((g) => (
                  <GroupRow key={g.id} group={g} onEvaluate={handleEvaluate} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {ungroupedStudents.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-surface-overlay/50 border-b border-border">
              <AlertTriangle size={14} className="text-semantic-warning" aria-hidden="true" />
              <span className="text-meta font-medium text-text-primary">
                Students Without a Group ({ungroupedStudents.length})
              </span>
            </div>
            <div className="divide-y divide-border">
              {ungroupedStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-full bg-surface-overlay flex items-center justify-center text-label font-medium text-text-secondary">
                    {s.full_name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-meta font-medium text-text-primary truncate">{s.full_name}</p>
                    <p className="text-label text-text-tertiary truncate">{s.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Modal isOpen={evalModal.isOpen} onClose={closeModal} title="Review Submission">
          <form onSubmit={submitEvaluation} className="space-y-5">
            <div>
              <p className="text-label text-text-tertiary uppercase tracking-widest mb-1">Reviewing</p>
              <p className="text-body font-medium text-text-primary">{evalModal.targetName}</p>
              <p className="text-meta text-text-secondary mt-0.5">{evalModal.groupName}</p>
            </div>

            <div>
              <label className="block text-meta font-medium text-text-primary mb-2">Decision</label>
              <div className="grid grid-cols-2 gap-2">
                {['accepted', 'rejected'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEvalModal(prev => ({ ...prev, status: s }))}
                    className={`px-4 text-meta font-medium rounded-xl border transition-all duration-200 capitalize ${
                      evalModal.status === s
                        ? s === 'accepted'
                          ? 'border-semantic-success/30 bg-semantic-success/10 text-semantic-success'
                          : 'border-semantic-danger/30 bg-semantic-danger/10 text-semantic-danger'
                        : 'border-border-strong text-text-secondary hover:bg-surface-overlay'
                    }`}
                    style={{ height: '40px' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="eval-feedback">Feedback</label>
              <textarea
                id="eval-feedback"
                name="feedback"
                className="input-field min-h-[100px] resize-y"
                placeholder="Provide constructive feedback…"
                value={evalModal.feedback}
                onChange={(e) => setEvalModal(prev => ({ ...prev, feedback: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={evalModal.submitting}>
                {evalModal.submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </form>
        </Modal>
      </PageShell>
    );
  }

  return (
    <PageShell title="Analytics" subtitle="Submission statistics across all assignments">
      {allStats.length === 0 ? (
        <EmptyState icon={BarChart3} title="No data yet" description="Create assignments to see analytics." />
      ) : (
        <div className="space-y-8">
          <div className="card p-6">
            <h2 className="text-section text-text-primary mb-5">Submissions by Assignment</h2>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allStats} barSize={28} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="title" tick={xAxisTick} tickLine={false} axisLine={axisLineStyle} />
                  <YAxis tick={yAxisTick} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,85,255,0.04)' }} />
                  <Bar name="Submitted" dataKey="submitted_count" fill="#0055FF" radius={[6, 6, 0, 0]} />
                  <Bar name="Total" dataKey="total_groups" fill="rgba(0,0,0,0.06)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-overlay/50">
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">Assignment</th>
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">Groups</th>
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">Submitted</th>
                  <th className="text-left px-5 py-3 text-label text-text-tertiary uppercase tracking-widest">Rate</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allStats.map((s) => {
                  const rate = s.total_groups > 0 ? Math.round((s.submitted_count / s.total_groups) * 100) : 0;
                  return (
                    <tr key={s.id} className="hover:bg-surface-overlay/50 transition-colors">
                      <td className="px-5 py-4 text-body font-medium text-text-primary">{s.title}</td>
                      <td className="px-5 py-4 font-mono text-meta text-text-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.total_groups}</td>
                      <td className="px-5 py-4 font-mono text-meta text-text-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.submitted_count}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-surface-overlay rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-label text-text-tertiary font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{rate}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link to={`/admin/analytics/${s.id}`} className="text-meta text-accent hover:text-accent-hover font-medium transition-colors">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
}
