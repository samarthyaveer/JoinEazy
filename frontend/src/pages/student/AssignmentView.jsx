import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Modal from '../../components/common/Modal';
import { StatusBadge, Spinner, EmptyState } from '../../components/common/UIComponents';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AssignmentView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Group creation
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  // Add member
  const [addEmail, setAddEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberMsg, setMemberMsg] = useState({ type: '', text: '' });

  // Submission flow
  const [submissionToken, setSubmissionToken] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subMsg, setSubMsg] = useState('');

  const loadAssignment = async () => {
    try {
      const { data } = await api.get(`/assignments/${id}`);
      setAssignment(data.assignment);
    } catch (err) {
      setError('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssignment(); }, [id]);

  if (loading) return <PageShell title="Assignment"><div className="flex justify-center py-20"><Spinner /></div></PageShell>;
  if (error || !assignment) return <PageShell title="Assignment"><EmptyState icon="⚠️" title={error || 'Not found'} /></PageShell>;

  const myGroup = assignment.my_group;
  const submission = assignment.my_submission;
  const isPastDue = new Date(assignment.due_date) < new Date();

  // --- Handlers ---

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post(`/groups/assignment/${id}`, { name: groupName });
      setShowCreateGroup(false);
      setGroupName('');
      await loadAssignment();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    setMemberMsg({ type: '', text: '' });
    try {
      const { data } = await api.post(`/groups/${myGroup.id}/members`, { email: addEmail });
      setMemberMsg({ type: 'success', text: data.message });
      setAddEmail('');
      await loadAssignment();
    } catch (err) {
      setMemberMsg({ type: 'error', text: err.response?.data?.error || 'Failed to add member' });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`/groups/${myGroup.id}/members/${userId}`);
      await loadAssignment();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleTrackClick = async () => {
    try {
      await api.post(`/submissions/${submission.id}/track-click`);
      window.open(assignment.onedrive_link, '_blank');
      await loadAssignment();
    } catch (err) {
      console.error(err);
      window.open(assignment.onedrive_link, '_blank');
    }
  };

  const handleInitiate = async () => {
    setSubMsg('');
    try {
      const { data } = await api.post(`/submissions/${submission.id}/initiate`);
      setSubmissionToken(data.token);
      setShowConfirm(true);
      await loadAssignment();
    } catch (err) {
      setSubMsg(err.response?.data?.error || 'Failed to initiate');
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubMsg('');
    try {
      await api.post(`/submissions/${submission.id}/confirm`, {
        token: submissionToken,
        assignmentTitle: confirmTitle,
      });
      setShowConfirm(false);
      setConfirmTitle('');
      await loadAssignment();
    } catch (err) {
      setSubMsg(err.response?.data?.error || 'Confirmation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title={assignment.title}
      subtitle={`Due ${new Date(assignment.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment details */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={submission?.status || 'pending'} />
              {isPastDue && <span className="badge-danger">Overdue</span>}
            </div>
            {assignment.description && (
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
            )}
          </div>

          {/* Submission section */}
          {myGroup && submission && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4">Submission</h3>

              {submission.status === 'submitted' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-md border border-emerald-200">
                    <span className="text-xl">✓</span>
                    <div>
                      <p className="text-sm font-medium text-emerald-800">All members have submitted successfully</p>
                      <p className="text-xs text-emerald-600">
                        {submission.confirmed_at && `Confirmed on ${new Date(submission.confirmed_at).toLocaleString('en-IN')}`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Evaluation Feedback Section */}
                  <div className="p-4 bg-surface-tertiary rounded-md border border-border">
                    <h4 className="text-sm font-semibold mb-4 text-text-primary border-b pb-2">Professor's Evaluation</h4>

                    <div className="space-y-4">
                      {/* Individual Evaluation */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Your Individual Feedback</h5>
                        {submission.my_evaluation_status !== 'ungraded' ? (
                           <div className="space-y-2">
                             <div className="flex items-center gap-2">
                               <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize border ${submission.my_evaluation_status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                 {submission.my_evaluation_status}
                               </span>
                             </div>
                             {submission.my_feedback && (
                               <div className="mt-2 p-3 bg-white rounded-md border border-border shadow-sm">
                                 <p className="text-sm text-text-secondary whitespace-pre-wrap">{submission.my_feedback}</p>
                               </div>
                             )}
                           </div>
                         ) : (
                           <p className="text-sm text-text-tertiary italic">Waiting for your individual review...</p>
                         )}
                      </div>

                      {/* Group Evaluation */}
                      <div className="space-y-2 pt-2 border-t border-border">
                        <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Overall Group Feedback</h5>
                        {submission.evaluation_status !== 'ungraded' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize border ${submission.evaluation_status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {submission.evaluation_status}
                              </span>
                            </div>
                            {submission.feedback && (
                              <div className="mt-2 p-3 bg-white rounded-md border border-border shadow-sm">
                                <p className="text-sm text-text-secondary whitespace-pre-wrap">{submission.feedback}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-text-tertiary italic">Waiting for overall group review...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : submission.my_submission_status === 'submitted' ? (
                <div className="p-4 bg-emerald-50 rounded-md border border-emerald-200">
                  <span className="text-xl inline-block mb-1">✓</span>
                  <p className="text-sm font-medium text-emerald-800 mb-1">You have submitted your work.</p>
                  <p className="text-xs text-emerald-600">Waiting for other group members to complete their submissions.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Step 1: Visit OneDrive link */}
                  <div className={`flex items-start gap-3 p-3 rounded-md border ${
                    submission.my_submission_status !== 'pending' ? 'bg-brand-50/50 border-brand-200' : 'bg-surface-tertiary border-border'
                  }`}>
                    <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      submission.my_submission_status !== 'pending' ? 'bg-brand-600 text-white' : 'bg-zinc-200 text-text-tertiary'
                    }`}>
                      {submission.my_submission_status !== 'pending' ? '✓' : '1'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Open submission link &amp; upload your work</p>
                      <p className="text-xs text-text-tertiary mt-0.5">Click to open OneDrive and upload your files</p>
                      <button onClick={handleTrackClick} className="btn-primary text-xs mt-2 px-3 py-1.5">
                        Open OneDrive Link ↗
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Initiate submission */}
                  <div className={`flex items-start gap-3 p-3 rounded-md border ${
                    submission.my_submission_status === 'awaiting_confirmation' || submission.my_submission_status === 'submitted'
                      ? 'bg-brand-50/50 border-brand-200'
                      : 'bg-surface-tertiary border-border'
                  }`}>
                    <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      submission.my_submission_status === 'awaiting_confirmation' || submission.my_submission_status === 'submitted'
                        ? 'bg-brand-600 text-white' : 'bg-zinc-200 text-text-tertiary'
                    }`}>
                      {submission.my_submission_status === 'awaiting_confirmation' ? '✓' : '2'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Confirm you have uploaded</p>
                      <p className="text-xs text-text-tertiary mt-0.5">Click once your files are uploaded to OneDrive</p>
                      <button
                        onClick={handleInitiate}
                        disabled={submission.my_submission_status === 'pending' || submission.my_submission_status === 'awaiting_confirmation'}
                        className="btn-secondary text-xs mt-2 px-3 py-1.5"
                      >
                        I have submitted my work
                      </button>
                    </div>
                  </div>

                  {subMsg && (
                    <p className="text-sm text-status-danger px-1">{subMsg}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No group yet */}
          {!myGroup && (
            <div className="card p-5">
              <EmptyState
                icon="👥"
                title="You need a group for this assignment"
                description="Create a group and add your team members to start working on this assignment."
                action={
                  <button onClick={() => setShowCreateGroup(true)} className="btn-primary text-xs">
                    Create Group
                  </button>
                }
              />
            </div>
          )}
        </div>

        {/* Sidebar column */}
        <div className="space-y-4">
          {/* Group info */}
          {myGroup && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold mb-3">Your Group</h3>
              <p className="text-sm font-medium">{myGroup.name}</p>
              <p className="text-xs text-text-tertiary mt-0.5 mb-3 capitalize">Role: {myGroup.my_role}</p>

              {/* Members list */}
              <div className="space-y-2 mb-3">
                {assignment.my_group_members?.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium">
                        {m.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{m.full_name}</p>
                        <p className="text-xs text-text-tertiary">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
                         m.submission_status === 'submitted' ? 'bg-emerald-100 text-emerald-800' :
                         m.submission_status === 'pending' ? 'bg-zinc-100 text-zinc-600' :
                         'bg-amber-100 text-amber-800'
                       }`}>
                         {m.submission_status?.replace(/_/g, ' ')}
                       </span>
                      {m.role === 'leader' ? (
                        <span className="text-xs text-brand-600 font-medium whitespace-nowrap">Lead</span>
                      ) : myGroup.my_role === 'leader' ? (
                        <button
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="text-xs text-status-danger hover:underline whitespace-nowrap"
                        >
                          Remove
                        </button>
                      ) : null}
                     </div>
                  </div>
                )) || <p className="text-xs text-text-tertiary">Loading members...</p>}
              </div>

              {/* Add member form (leader only) */}
              {myGroup.my_role === 'leader' && (
                <form onSubmit={handleAddMember} className="pt-3 border-t">
                  <label className="block text-xs font-medium mb-1">Add member by email</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      className="input-field text-xs flex-1"
                      placeholder="student@email.com"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn-primary text-xs px-3" disabled={addingMember}>
                      {addingMember ? '...' : 'Add'}
                    </button>
                  </div>
                  {memberMsg.text && (
                    <p className={`text-xs mt-1.5 ${memberMsg.type === 'error' ? 'text-status-danger' : 'text-status-success'}`}>
                      {memberMsg.text}
                    </p>
                  )}
                </form>
              )}
            </div>
          )}

          {/* Assignment meta */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-text-tertiary">Posted by</dt>
                <dd className="font-medium">{assignment.creator_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-tertiary">Due date</dt>
                <dd className={isPastDue ? 'text-status-danger font-medium' : ''}>
                  {new Date(assignment.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-tertiary">Max group size</dt>
                <dd>{assignment.max_group_size} members</dd>
              </div>
              <div>
                <dt className="text-xs text-text-tertiary">Groups formed</dt>
                <dd>{assignment.groups?.length || 0}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Create group modal */}
      <Modal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} title="Create a group">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Group name</label>
            <input
              className="input-field"
              placeholder="e.g. Team Alpha"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreateGroup(false)} className="btn-secondary text-sm">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-sm" disabled={creating}>
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm submission modal (Gate 3) */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Your Submission">
        <form onSubmit={handleConfirm} className="space-y-4">
          <p className="text-sm text-text-secondary">
            To confirm your submission, type the assignment title below:
          </p>
          <p className="text-sm font-mono bg-surface-tertiary px-3 py-2 rounded-md border">
            {assignment.title}
          </p>
          <input
            className="input-field"
            placeholder="Type the assignment title exactly"
            value={confirmTitle}
            onChange={(e) => setConfirmTitle(e.target.value)}
            required
          />
          {subMsg && <p className="text-sm text-status-danger">{subMsg}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowConfirm(false)} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-sm"
              disabled={submitting || confirmTitle.trim().toLowerCase() !== assignment.title.trim().toLowerCase()}
            >
              {submitting ? 'Confirming...' : 'Confirm Submission'}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
