import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import Users from "lucide-react/dist/esm/icons/users";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import PageShell from "@/components/layout/PageShell";
import Modal from "@/components/common/Modal";
import ErrorBanner from "@/components/common/ErrorBanner";
import {
  StatusBadge,
  Spinner,
  EmptyState,
  ProgressBar,
} from "@/components/common/UIComponents";
import { studentApi } from "@/services/api";
import { usePageReady } from "@/context/InitialLoadContext";

const STATUS_ORDER = [
  "pending",
  "link_visited",
  "awaiting_confirmation",
  "submitted",
];

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function MessageBanner({ type = "info", text }) {
  if (!text) return null;

  const styles = {
    error: "border-semantic-danger/20 bg-semantic-danger/6 text-semantic-danger",
    success: "border-semantic-success/20 bg-semantic-success/8 text-semantic-success",
    info: "border-border bg-surface-overlay/80 text-text-secondary",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-meta ${styles[type] || styles.info}`}>
      {text}
    </div>
  );
}

function WorkflowStep({
  step,
  title,
  description,
  done,
  action,
  actionLabel,
  disabled,
  tone = "primary",
}) {
  const buttonClass = tone === "secondary" ? "btn-secondary btn-sm" : "btn-primary btn-sm";

  return (
    <div
      className={`rounded-[24px] border p-4 sm:p-5 ${
        done ? "border-accent/20 bg-accent/6" : "border-border bg-surface-raised/78"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            done
              ? "bg-accent text-white"
              : "bg-surface-overlay text-text-tertiary border border-border"
          }`}
        >
          {done ? <CheckCircle2 size={18} aria-hidden="true" /> : <span className="text-meta font-semibold">{step}</span>}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold text-text-primary">{title}</p>
          <p className="text-meta text-text-secondary mt-1">{description}</p>
          {action ? (
            <button
              onClick={action}
              disabled={disabled}
              className={`${buttonClass} mt-4`}
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AssignmentView() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  usePageReady(!loading);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [groupNotice, setGroupNotice] = useState({ type: "", text: "" });

  const [addEmail, setAddEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberMsg, setMemberMsg] = useState({ type: "", text: "" });

  const [submissionToken, setSubmissionToken] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subMsg, setSubMsg] = useState({ type: "", text: "" });

  const loadAssignment = useCallback(async ({ showPageError = true } = {}) => {
    try {
      if (showPageError) {
        setPageError("");
      }
      const { data } = await studentApi.getAssignmentById(id);
      setAssignment(data.assignment);
      return data.assignment;
    } catch (err) {
      if (showPageError) {
        setPageError(err.message || "Couldn't load assignment. Refresh and try again.");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  const myGroup = assignment?.my_group;
  const submission = assignment?.my_submission;
  const groupMembers = assignment?.my_group_members || [];
  const isPastDue = assignment ? new Date(assignment.due_date) < new Date() : false;
  const groupIsFull = groupMembers.length >= Number(assignment?.max_group_size || 0);
  const submittedMembers = useMemo(
    () => groupMembers.filter((member) => member.submission_status === "submitted").length,
    [groupMembers],
  );

  const isStepDone = useCallback(
    (step) => {
      const current = STATUS_ORDER.indexOf(
        submission?.my_submission_status || "pending",
      );
      return current >= step;
    },
    [submission?.my_submission_status],
  );

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    setCreating(true);
    setGroupNotice({ type: "", text: "" });

    try {
      await studentApi.createGroup(id, { name: groupName });
      setShowCreateGroup(false);
      setGroupName("");
      setGroupNotice({ type: "success", text: "Group created. You can now invite teammates and start submitting." });
      await loadAssignment({ showPageError: false });
    } catch (err) {
      setGroupNotice({
        type: "error",
        text: err.message || "Couldn't create the group. Try a clearer name.",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    setAddingMember(true);
    setMemberMsg({ type: "", text: "" });

    try {
      const { data } = await studentApi.addGroupMember(myGroup.id, {
        email: addEmail,
      });
      setMemberMsg({ type: "success", text: data.message });
      setAddEmail("");
      await loadAssignment({ showPageError: false });
    } catch (err) {
      setMemberMsg({
        type: "error",
        text: err.message || "Couldn't add that member. Check the email and try again.",
      });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setMemberMsg({ type: "", text: "" });

    try {
      await studentApi.removeGroupMember(myGroup.id, userId);
      setMemberMsg({ type: "success", text: "Member removed from the group." });
      await loadAssignment({ showPageError: false });
    } catch (err) {
      setMemberMsg({
        type: "error",
        text: err.message || "Couldn't remove that member right now.",
      });
    }
  };

  const handleTrackClick = async () => {
    setSubMsg({ type: "", text: "" });

    try {
      await studentApi.trackSubmissionClick(submission.id);
      window.open(assignment.onedrive_link, "_blank", "noopener,noreferrer");
      await loadAssignment({ showPageError: false });
    } catch (err) {
      window.open(assignment.onedrive_link, "_blank", "noopener,noreferrer");
      setSubMsg({
        type: "info",
        text: err.message || "The folder opened, but the click wasn't recorded cleanly. You can continue and mark the upload when ready.",
      });
    }
  };

  const handleInitiate = async () => {
    setSubMsg({ type: "", text: "" });

    try {
      const { data } = await studentApi.initiateSubmission(submission.id);
      setSubmissionToken(data.token);
      setShowConfirm(true);
      await loadAssignment({ showPageError: false });
    } catch (err) {
      setSubMsg({
        type: "error",
        text: err.message || "Couldn't move to confirmation yet.",
      });
    }
  };

  const handleConfirm = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubMsg({ type: "", text: "" });

    try {
      await studentApi.confirmSubmission(submission.id, {
        token: submissionToken,
        assignmentTitle: confirmTitle,
      });
      setShowConfirm(false);
      setConfirmTitle("");
      setSubMsg({ type: "success", text: "Your submission has been confirmed." });
      await loadAssignment({ showPageError: false });
    } catch (err) {
      setSubMsg({
        type: "error",
        text: err.message || "Couldn't confirm the submission. Check the title and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Assignment workspace" subtitle="Loading instructions and group status">
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  if (pageError || !assignment) {
    return (
      <PageShell title="Assignment workspace" subtitle="Everything for this assignment lives here">
        <ErrorBanner message={pageError || "Assignment missing"} onRetry={loadAssignment} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={assignment.title}
      subtitle={`Due on ${dateFmt.format(new Date(assignment.due_date))}`}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_360px] gap-6 xl:gap-8">
        <div className="space-y-6">
          <section className="card p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <StatusBadge
                    status={
                      !myGroup
                        ? isPastDue
                          ? "missing_deadline"
                          : "needs_group"
                        : submission?.status === "submitted"
                          ? "submitted"
                          : submission?.my_submission_status || "group_ready"
                    }
                  />
                  {isPastDue ? <span className="badge-danger">Past due</span> : null}
                </div>
                <p className="text-body text-text-secondary whitespace-pre-wrap">
                  {assignment.description || "Open the submission folder, upload your work, and confirm the assignment title to finish."}
                </p>
              </div>

              <div className="rounded-[24px] border border-border bg-surface-overlay/70 px-4 py-4 min-w-[220px]">
                <div className="flex items-center gap-2 text-label uppercase tracking-widest text-text-tertiary">
                  <CalendarClock size={14} aria-hidden="true" />
                  Deadline
                </div>
                <p className={`text-body font-semibold mt-2 ${isPastDue ? "text-semantic-danger" : "text-text-primary"}`}>
                  {dateTimeFmt.format(new Date(assignment.due_date))}
                </p>
                <p className="text-meta text-text-secondary mt-1">
                  {assignment.max_group_size} members max per group
                </p>
              </div>
            </div>
          </section>

          {!myGroup ? (
            <section className="card p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-accent/8 text-accent px-3 py-1.5 text-label mb-4">
                    <ShieldCheck size={14} aria-hidden="true" />
                    Start by creating your team
                  </div>
                  <h2 className="text-section text-text-primary">No group yet</h2>
                  <p className="text-body text-text-secondary mt-2">
                    Create a group, invite teammates, and the upload workflow becomes available immediately. You only need a group name to begin.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                    <div className="rounded-[22px] border border-border bg-surface-raised/78 p-4">
                      <p className="text-label uppercase tracking-widest text-text-tertiary">Step 1</p>
                      <p className="text-meta text-text-primary mt-2">Create the group</p>
                    </div>
                    <div className="rounded-[22px] border border-border bg-surface-raised/78 p-4">
                      <p className="text-label uppercase tracking-widest text-text-tertiary">Step 2</p>
                      <p className="text-meta text-text-primary mt-2">Invite teammates</p>
                    </div>
                    <div className="rounded-[22px] border border-border bg-surface-raised/78 p-4 col-span-2 sm:col-span-1">
                      <p className="text-label uppercase tracking-widest text-text-tertiary">Step 3</p>
                      <p className="text-meta text-text-primary mt-2">Upload and confirm</p>
                    </div>
                  </div>
                </div>

                <div className="lg:w-[260px]">
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="btn-primary w-full"
                  >
                    Create group
                  </button>
                  <MessageBanner type={groupNotice.type} text={groupNotice.text} />
                </div>
              </div>
            </section>
          ) : null}

          {myGroup && submission ? (
            <section className="card p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-section text-text-primary">Submission flow</h2>
                  <p className="text-body text-text-secondary mt-2">
                    Follow the steps in order so your upload is recorded cleanly for the whole group.
                  </p>
                </div>
                <div className="rounded-[22px] border border-border bg-surface-overlay/70 px-4 py-3">
                  <p className="text-label uppercase tracking-widest text-text-tertiary">
                    Team progress
                  </p>
                  <p className="text-body font-semibold text-text-primary mt-1">
                    {submittedMembers}/{groupMembers.length} finished
                  </p>
                </div>
              </div>

              {submission.status === "submitted" ? (
                <div className="space-y-5">
                <div className="rounded-[24px] border border-semantic-success/20 bg-semantic-success/8 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        size={20}
                        className="text-semantic-success shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-body font-semibold text-text-primary">
                          Your group has submitted successfully
                        </p>
                        <p className="text-meta text-text-secondary mt-1">
                          {submission.confirmed_at
                            ? `Confirmed ${dateTimeFmt.format(new Date(submission.confirmed_at))}`
                            : "Submission confirmation complete."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-border bg-surface-raised/78 p-4 sm:p-5">
                    <p className="text-label uppercase tracking-widest text-text-tertiary">
                      Grade status
                    </p>
                    {submission.grade_published ? (
                      <div className="mt-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="badge badge-success">
                            Grade published
                          </span>
                          <span className="text-body font-semibold text-text-primary">
                            {submission.graded_score} / {submission.total_marks}
                          </span>
                        </div>
                        <p className="text-meta text-text-secondary mt-3 whitespace-pre-wrap">
                          {submission.grade_feedback || "Your instructor did not leave score notes yet."}
                        </p>
                      </div>
                    ) : (
                      <p className="text-meta text-text-secondary mt-3">
                        Your instructor has not published a grade yet.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-[24px] border border-border bg-surface-raised/78 p-4 sm:p-5">
                      <p className="text-label uppercase tracking-widest text-text-tertiary">
                        Personal feedback
                      </p>
                      {submission.my_evaluation_status !== "ungraded" ? (
                        <div className="mt-3">
                          <span
                            className={`badge ${submission.my_evaluation_status === "accepted" ? "badge-success" : "badge-danger"} capitalize`}
                          >
                            {submission.my_evaluation_status}
                          </span>
                          <p className="text-meta text-text-secondary mt-3 whitespace-pre-wrap">
                            {submission.my_feedback || "No individual notes yet."}
                          </p>
                        </div>
                      ) : (
                        <p className="text-meta text-text-secondary mt-3">
                          Instructor review hasn't been posted yet.
                        </p>
                      )}
                    </div>

                    <div className="rounded-[24px] border border-border bg-surface-raised/78 p-4 sm:p-5">
                      <p className="text-label uppercase tracking-widest text-text-tertiary">
                        Group feedback
                      </p>
                      {submission.evaluation_status !== "ungraded" ? (
                        <div className="mt-3">
                          <span
                            className={`badge ${submission.evaluation_status === "accepted" ? "badge-success" : "badge-danger"} capitalize`}
                          >
                            {submission.evaluation_status}
                          </span>
                          <p className="text-meta text-text-secondary mt-3 whitespace-pre-wrap">
                            {submission.feedback || "No group notes yet."}
                          </p>
                        </div>
                      ) : (
                        <p className="text-meta text-text-secondary mt-3">
                          Group review hasn't been posted yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : submission.my_submission_status === "submitted" ? (
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-semantic-success/20 bg-semantic-success/8 p-4 sm:p-5">
                    <p className="text-body font-semibold text-text-primary">
                      Your part is complete
                    </p>
                    <p className="text-meta text-text-secondary mt-1">
                      You have confirmed the upload. The group submission finalizes when every teammate finishes.
                    </p>
                  </div>
                  <MessageBanner type={subMsg.type} text={subMsg.text} />
                </div>
              ) : (
                <div className="space-y-4">
                  <WorkflowStep
                    step="1"
                    title="Open the submission folder"
                    description="Upload the latest files to the OneDrive link before moving ahead."
                    done={isStepDone(1)}
                    action={handleTrackClick}
                    actionLabel={
                      isStepDone(1) ? "Open folder again" : "Open OneDrive folder"
                    }
                  />

                  <WorkflowStep
                    step="2"
                    title="Mark the upload complete"
                    description="Once your files are in the folder, mark the upload so we can generate the short confirmation token."
                    done={isStepDone(2)}
                    action={handleInitiate}
                    actionLabel="Mark upload complete"
                    disabled={!isStepDone(1) || isStepDone(2)}
                    tone="secondary"
                  />

                  <WorkflowStep
                    step="3"
                    title="Confirm the assignment title"
                    description="The final check happens in a modal so you can confirm the exact assignment name safely."
                    done={isStepDone(3)}
                  />

                  <MessageBanner type={subMsg.type} text={subMsg.text} />
                </div>
              )}
            </section>
          ) : null}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-8 self-start">
          {myGroup ? (
            <section className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-section text-text-primary">Your group</h3>
                  <p className="text-body font-semibold text-text-primary mt-2">
                    {myGroup.name}
                  </p>
                  <p className="text-meta text-text-secondary mt-1 capitalize">
                    You are the {myGroup.my_role}
                  </p>
                </div>
                <span className="badge badge-neutral">
                  {groupMembers.length}/{assignment.max_group_size}
                </span>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-label uppercase tracking-widest text-text-tertiary">
                    Submission progress
                  </p>
                  <span className="text-label text-text-tertiary">
                    {submittedMembers}/{groupMembers.length}
                  </span>
                </div>
                <ProgressBar
                  value={submittedMembers}
                  max={Math.max(groupMembers.length, 1)}
                />
              </div>

              <div className="space-y-3 mt-5">
                {groupMembers.map((member) => (
                  <div
                    key={member.user_id}
                    className="rounded-[20px] border border-border bg-surface-raised/78 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-surface-overlay flex items-center justify-center text-meta font-semibold text-text-secondary shrink-0">
                          {member.full_name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-meta font-medium text-text-primary truncate">
                            {member.full_name}
                          </p>
                          <p className="text-label text-text-tertiary truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-label font-medium capitalize ${
                            member.submission_status === "submitted"
                              ? "text-semantic-success"
                              : member.submission_status === "pending"
                                ? "text-text-tertiary"
                                : "text-semantic-warning"
                          }`}
                        >
                          {member.submission_status?.replace(/_/g, " ")}
                        </p>
                        {member.role === "leader" ? (
                          <p className="text-label text-accent mt-1">Leader</p>
                        ) : myGroup.my_role === "leader" ? (
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-label text-semantic-danger mt-1 hover:underline"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {myGroup.my_role === "leader" ? (
                <form onSubmit={handleAddMember} className="pt-5 mt-5 border-t border-border">
                  <label
                    className="block text-label uppercase tracking-widest text-text-tertiary mb-2"
                    htmlFor="add-member-email"
                  >
                    Invite a teammate
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="add-member-email"
                      name="memberEmail"
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      className="input-field flex-1 text-meta"
                      placeholder="name@example.com"
                      value={addEmail}
                      onChange={(event) => setAddEmail(event.target.value.toLowerCase())}
                      required
                      disabled={groupIsFull}
                    />
                    <button
                      type="submit"
                      className="btn-primary btn-sm"
                      disabled={addingMember || groupIsFull}
                    >
                      {groupIsFull ? "Group full" : addingMember ? "Adding..." : "Add member"}
                    </button>
                  </div>
                  <p className="text-label text-text-tertiary mt-2">
                    {groupIsFull
                      ? "This team has reached the maximum size."
                      : "Students are added directly by email."}
                  </p>
                  <MessageBanner type={memberMsg.type} text={memberMsg.text} />
                </form>
              ) : null}
            </section>
          ) : null}

          <section className="card p-4 sm:p-5">
            <h3 className="text-section text-text-primary">Assignment facts</h3>
            <dl className="grid grid-cols-2 gap-3 mt-5">
              <div className="rounded-[20px] border border-border bg-surface-overlay/65 p-4">
                <dt className="text-label uppercase tracking-widest text-text-tertiary">
                  Posted by
                </dt>
                <dd className="text-body font-semibold text-text-primary mt-2">
                  {assignment.creator_name}
                </dd>
              </div>

              <div className="rounded-[20px] border border-border bg-surface-overlay/65 p-4">
                <dt className="text-label uppercase tracking-widest text-text-tertiary">
                  Due
                </dt>
                <dd className={`text-body font-semibold mt-2 ${isPastDue ? "text-semantic-danger" : "text-text-primary"}`}>
                  {dateTimeFmt.format(new Date(assignment.due_date))}
                </dd>
              </div>

              <div className="rounded-[20px] border border-border bg-surface-overlay/65 p-4">
                <dt className="text-label uppercase tracking-widest text-text-tertiary">
                  Max group size
                </dt>
                <dd className="text-body font-semibold text-text-primary mt-2">
                  {assignment.max_group_size} members
                </dd>
              </div>

              <div className="rounded-[20px] border border-border bg-surface-overlay/65 p-4">
                <dt className="text-label uppercase tracking-widest text-text-tertiary">
                  Groups formed
                </dt>
                <dd className="text-body font-semibold text-text-primary mt-2">
                  {assignment.groups?.length || 0}
                </dd>
              </div>
            </dl>
          </section>

          {!myGroup ? (
            <section className="card p-4 sm:p-5">
              <EmptyState
                icon={Users}
                title="Group required"
                description="Create your group first, then the upload steps appear here."
                action={
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="btn-primary btn-sm"
                  >
                    Create group
                  </button>
                }
              />
              <MessageBanner type={groupNotice.type} text={groupNotice.text} />
            </section>
          ) : null}
        </aside>
      </div>

      <Modal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        title="Create your group"
      >
        <form onSubmit={handleCreateGroup} className="space-y-5">
          <div>
            <label
              className="block text-meta font-medium text-text-primary mb-2"
              htmlFor="group-name"
            >
              Group name
            </label>
            <input
              id="group-name"
              name="groupName"
              className="input-field"
              placeholder="e.g. Team Alpha"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              autoComplete="off"
              required
            />
            <p className="text-label text-text-tertiary mt-2">
              Pick something easy for teammates to recognize.
            </p>
          </div>
          <MessageBanner type={groupNotice.type} text={groupNotice.text} />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateGroup(false)}
              className="btn-secondary"
            >
              Back
            </button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Creating..." : "Create group"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm submission"
      >
        <form onSubmit={handleConfirm} className="space-y-5">
          <p className="text-body text-text-secondary">
            Type the assignment title exactly to confirm the final upload step.
          </p>
          <div className="rounded-[20px] border border-border bg-surface-overlay/70 px-4 py-3 text-body font-mono text-text-primary">
            {assignment.title}
          </div>
          <input
            id="confirm-assignment-title"
            name="confirmAssignmentTitle"
            className="input-field"
            placeholder="Type the exact title"
            value={confirmTitle}
            onChange={(event) => setConfirmTitle(event.target.value)}
            autoComplete="off"
            required
          />
          <MessageBanner type={subMsg.type} text={subMsg.text} />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="btn-secondary"
            >
              Back
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={
                submitting ||
                confirmTitle.trim().toLowerCase() !==
                  assignment.title.trim().toLowerCase()
              }
            >
              {submitting ? "Confirming..." : "Confirm submission"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
