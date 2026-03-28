import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Users from 'lucide-react/dist/esm/icons/users';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Circle from 'lucide-react/dist/esm/icons/circle';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import PageShell from '@/components/layout/PageShell';
import Modal from '@/components/common/Modal';
import { StatusBadge, Spinner, EmptyState } from '@/components/common/UIComponents';
import { studentApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const STATUS_ORDER = ['pending', 'link_visited', 'awaiting_confirmation', 'submitted'];
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AssignmentView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const [addEmail, setAddEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberMsg, setMemberMsg] = useState({ type: '', text: '' });

  const [submissionToken, setSubmissionToken] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subMsg, setSubMsg] = useState('');

  const loadAssignment = useCallback(async () => {
    try {
      const { data } = await studentApi.getAssignmentById(id);
      setAssignment(data.assignment);
    } catch (err) {
      setError('Failed to load assignment. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAssignment(); }, [loadAssignment]);

  if (loading) return <PageShell title="Assignment"><div className="flex justify-center py-20"><Spinner /></div></PageShell>;
  if (error || !assignment) return <PageShell title="Assignment"><EmptyState icon={AlertTriangle} title={error || 'Assignment not found'} /></PageShell>;

  const myGroup = assignment.my_group;
  const submission = assignment.my_submission;
  const isPastDue = new Date(assignment.due_date) < new Date();

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await studentApi.createGroup(id, { name: groupName });
      setShowCreateGroup(false);
      setGroupName('');
      await loadAssignment();
    } catch (err) {
      setError(err?.message || err.response?.data?.error || 'Failed to create group. Try a different name.');
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    setMemberMsg({ type: '', text: '' });
    try {
      const { data } = await studentApi.addGroupMember(myGroup.id, { email: addEmail });
      setMemberMsg({ type: 'success', text: data.message });
      setAddEmail('');
      await loadAssignment();
    } catch (err) {
      setMemberMsg({ type: 'error', text: err?.message || err.response?.data?.error || 'Failed to add member. Check the email address.' });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await studentApi.removeGroupMember(myGroup.id, userId);
      await loadAssignment();
    } catch (err) {
      setMemberMsg({ type: 'error', text: err?.message || err.response?.data?.error || 'Failed to remove member.' });
    }
  };

  const handleTrackClick = async () => {
    try {
      await studentApi.trackSubmissionClick(submission.id);
      window.open(assignment.onedrive_link, '_blank');
      await loadAssignment();
    } catch (err) {
      window.open(assignment.onedrive_link, '_blank');
    }
  };

  const handleInitiate = async () => {
    setSubMsg('');
    try {
      const { data } = await studentApi.initiateSubmission(submission.id);
      setSubmissionToken(data.token);
      setShowConfirm(true);
      await loadAssignment();
    } catch (err) {
      setSubMsg(err?.message || err.response?.data?.error || 'Failed to initiate. Try again.');
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubMsg('');
    try {
      await studentApi.confirmSubmission(submission.id, {
        token: submissionToken,
        assignmentTitle: confirmTitle,
      });
      setShowConfirm(false);
      setConfirmTitle('');
      await loadAssignment();
    } catch (err) {
      setSubMsg(err?.message || err.response?.data?.error || 'Confirmation failed. Check the title and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isStepDone = (step) => {
    const current = STATUS_ORDER.indexOf(submission?.my_submission_status || 'pending');
    return current >= step;
  };

  return (
    <PageShell
      title={assignment.title}
      subtitle={`Due ${dateFmt.format(new Date(assignment.due_date))}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment details */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <StatusBadge status={submission?.status || 'pending'} />
              {isPastDue ? <span className="badge-danger">Overdue</span> : null}
            </div>
            {assignment.description ? (
              <p className="text-body text-text-secondary leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
            ) : null}
          </div>

          {/* Submission section */}
          {myGroup && submission ? (
            <div className="card p-6">
              <h3 className="text-section text-text-primary mb-5">Submission</h3>

              {submission.status === 'submitted' ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-semantic-success/10 rounded-xl border border-semantic-success/20">
                    <CheckCircle2 size={20} className="text-semantic-success flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-body font-medium text-text-primary">All members have submitted</p>
                      <p className="text-meta text-text-secondary mt-0.5">
                        {submission.confirmed_at ? `Confirmed on ${dateTimeFmt.format(new Date(submission.confirmed_at))}` : null}
                      </p>
                    </div>
                  </div>

                  {/* Evaluation Feedback */}
                  <div className="space-y-5">
                    <h4 className="text-body font-semibold text-text-primary">Professor's Evaluation</h4>

                    <div>
                      <p className="text-label text-text-tertiary uppercase tracking-widest mb-2">Your Individual Feedback</p>
                      {submission.my_evaluation_status !== 'ungraded' ? (
                        <div>
                          <span className={`badge ${submission.my_evaluation_status === 'accepted' ? 'badge-success' : 'badge-danger'} capitalize`}>
                            {submission.my_evaluation_status}
                          </span>
                          {submission.my_feedback ? (
                            <div className="mt-3 p-4 bg-surface-overlay rounded-xl border border-border">
                              <p className="text-body text-text-secondary whitespace-pre-wrap">{submission.my_feedback}</p>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-meta text-text-tertiary">Awaiting review…</p>
                      )}
                    </div>

                    <div className="pt-5 border-t border-border">
                      <p className="text-label text-text-tertiary uppercase tracking-widest mb-2">Overall Group Feedback</p>
                      {submission.evaluation_status !== 'ungraded' ? (
                        <div>
                          <span className={`badge ${submission.evaluation_status === 'accepted' ? 'badge-success' : 'badge-danger'} capitalize`}>
                            {submission.evaluation_status}
                          </span>
                          {submission.feedback ? (
                            <div className="mt-3 p-4 bg-surface-overlay rounded-xl border border-border">
                              <p className="text-body text-text-secondary whitespace-pre-wrap">{submission.feedback}</p>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-meta text-text-tertiary">Awaiting review…</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : submission.my_submission_status === 'submitted' ? (
                <div className="flex items-center gap-3 p-4 bg-semantic-success/10 rounded-xl border border-semantic-success/20">
                  <CheckCircle2 size={20} className="text-semantic-success flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-body font-medium text-text-primary">You have submitted your work</p>
                    <p className="text-meta text-text-secondary">Waiting for other members…</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className={`flex items-start gap-4 p-4 rounded-xl border ${isStepDone(1) ? 'bg-accent/8 border-accent/20' : 'bg-surface-overlay border-border'}`}>
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isStepDone(1) ? 'bg-accent text-white' : 'bg-surface-overlay text-text-tertiary border border-border-strong'}`}>
                      {isStepDone(1) ? <CheckCircle2 size={14} aria-hidden="true" /> : <span className="text-label font-semibold">1</span>}
                    </div>
                    <div className="flex-1">
                      <p className="text-body font-medium text-text-primary">Open Submission Link & Upload</p>
                      <p className="text-meta text-text-secondary mt-0.5">Click to open OneDrive and upload your files</p>
                      <button onClick={handleTrackClick} className="btn-primary btn-sm mt-3">
                        <ExternalLink size={14} aria-hidden="true" />
                        Open OneDrive
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className={`flex items-start gap-4 p-4 rounded-xl border ${isStepDone(2) ? 'bg-accent/8 border-accent/20' : 'bg-surface-overlay border-border'}`}>
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isStepDone(2) ? 'bg-accent text-white' : 'bg-surface-overlay text-text-tertiary border border-border-strong'}`}>
                      {isStepDone(2) ? <CheckCircle2 size={14} aria-hidden="true" /> : <span className="text-label font-semibold">2</span>}
                    </div>
                    <div className="flex-1">
                      <p className="text-body font-medium text-text-primary">Confirm Upload</p>
                      <p className="text-meta text-text-secondary mt-0.5">Click once your files are uploaded</p>
                      <button
                        onClick={handleInitiate}
                        disabled={!isStepDone(1) || isStepDone(2)}
                        className="btn-secondary btn-sm mt-3"
                      >
                        I Have Submitted
                      </button>
                    </div>
                  </div>

                  {subMsg ? (
                    <p className="text-meta text-semantic-danger px-1">{subMsg}</p>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {/* No group */}
          {!myGroup ? (
            <div className="card p-6">
              <EmptyState
                icon={Users}
                title="You need a group for this assignment"
                description="Create a group and add your team members to start."
                action={
                  <button onClick={() => setShowCreateGroup(true)} className="btn-primary btn-sm">
                    Create Group
                  </button>
                }
              />
            </div>
          ) : null}
        </div>

        {/* Sidebar column */}
        <div className="space-y-4">
          {myGroup ? (
            <div className="card p-5">
              <h3 className="text-section text-text-primary mb-4">Your Group</h3>
              <p className="text-body font-medium text-text-primary">{myGroup.name}</p>
              <p className="text-meta text-text-secondary mt-0.5 mb-4 capitalize">Role: {myGroup.my_role}</p>

              <div className="space-y-3 mb-4">
                {assignment.my_group_members?.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-overlay flex items-center justify-center text-label font-medium text-text-secondary">
                        {m.full_name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-meta font-medium text-text-primary truncate">{m.full_name}</p>
                        <p className="text-label text-text-tertiary truncate">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-label font-medium capitalize ${
                        m.submission_status === 'submitted' ? 'text-semantic-success' :
                        m.submission_status === 'pending' ? 'text-text-tertiary' :
                        'text-semantic-warning'
                      }`}>
                        {m.submission_status?.replace(/_/g, ' ')}
                      </span>
                      {m.role === 'leader' ? (
                        <span className="text-label text-accent font-medium">Lead</span>
                      ) : myGroup.my_role === 'leader' ? (
                        <button
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="text-label text-semantic-danger hover:underline"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                )) || <p className="text-meta text-text-tertiary">Loading members…</p>}
              </div>

              {myGroup.my_role === 'leader' ? (
                <form onSubmit={handleAddMember} className="pt-4 border-t border-border">
                  <label className="block text-label font-medium text-text-tertiary mb-2 uppercase tracking-widest" htmlFor="add-member-email">Add Member by Email</label>
                  <div className="flex gap-2">
                    <input
                      id="add-member-email"
                      name="memberEmail"
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      className="input-field flex-1 text-meta"
                      placeholder="student@email.com"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      required
                      style={{ height: '36px' }}
                    />
                    <button type="submit" className="btn-primary btn-sm" disabled={addingMember}>
                      {addingMember ? '…' : 'Add'}
                    </button>
                  </div>
                  {memberMsg.text ? (
                    <p className={`text-meta mt-2 ${memberMsg.type === 'error' ? 'text-semantic-danger' : 'text-semantic-success'}`}>
                      {memberMsg.text}
                    </p>
                  ) : null}
                </form>
              ) : null}
            </div>
          ) : null}

          <div className="card p-5">
            <h3 className="text-section text-text-primary mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-label text-text-tertiary uppercase tracking-widest">Posted By</dt>
                <dd className="text-body font-medium text-text-primary mt-0.5">{assignment.creator_name}</dd>
              </div>
              <div>
                <dt className="text-label text-text-tertiary uppercase tracking-widest">Due Date</dt>
                <dd className={`text-body mt-0.5 ${isPastDue ? 'text-semantic-danger font-medium' : 'text-text-primary'}`}>
                  {dateTimeFmt.format(new Date(assignment.due_date))}
                </dd>
              </div>
              <div>
                <dt className="text-label text-text-tertiary uppercase tracking-widest">Max Group Size</dt>
                <dd className="text-body text-text-primary mt-0.5 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{assignment.max_group_size} members</dd>
              </div>
              <div>
                <dt className="text-label text-text-tertiary uppercase tracking-widest">Groups Formed</dt>
                <dd className="text-body text-text-primary mt-0.5 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{assignment.groups?.length || 0}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <Modal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} title="Create a Group">
        <form onSubmit={handleCreateGroup} className="space-y-5">
          <div>
            <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="group-name">Group Name</label>
            <input
              id="group-name"
              name="groupName"
              className="input-field"
              placeholder="e.g. Team Alpha…"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreateGroup(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Submission">
        <form onSubmit={handleConfirm} className="space-y-5">
          <p className="text-body text-text-secondary">
            To confirm, type the assignment title below:
          </p>
          <p className="text-body font-mono bg-surface-overlay px-4 py-3 rounded-xl border border-border text-text-primary">
            {assignment.title}
          </p>
          <input
            className="input-field"
            placeholder="Type the assignment title exactly…"
            value={confirmTitle}
            onChange={(e) => setConfirmTitle(e.target.value)}
            autoComplete="off"
            required
          />
          {subMsg ? <p className="text-meta text-semantic-danger">{subMsg}</p> : null}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowConfirm(false)} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || confirmTitle.trim().toLowerCase() !== assignment.title.trim().toLowerCase()}
            >
              {submitting ? 'Confirming…' : 'Confirm Submission'}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
