import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Users from "lucide-react/dist/esm/icons/users";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import PageShell from "@/components/layout/PageShell";
import ErrorBanner from "@/components/common/ErrorBanner";
import EmptyState from "@/components/common/EmptyState";
import Modal from "@/components/common/Modal";
import FeedbackComposer from "@/components/admin/FeedbackComposer";
import { getSubmissionDetail, publishGrade, saveGrade } from "@/services/api";
import { gradeLetterFromPercent, percentFromScore } from "@/utils/grade";
import { timeAgo } from "@/utils/time";

const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function StatusBadge({ submission }) {
  const tone =
    submission.reviewState === "published"
      ? "badge-success"
      : submission.reviewState === "draft"
        ? "badge-warning"
        : "badge-neutral";

  const label =
    submission.reviewState === "published"
      ? "Published"
      : submission.reviewState === "draft"
        ? "Draft saved"
        : "Needs grading";

  return <span className={`badge ${tone}`}>{label}</span>;
}

function MemberStatus({ member }) {
  const tone =
    member.submission_status === "submitted"
      ? "text-semantic-success"
      : member.submission_status === "pending"
        ? "text-text-tertiary"
        : "text-semantic-warning";

  return (
    <span className={`text-label font-medium capitalize ${tone}`}>
      {member.submission_status?.replace(/_/g, " ")}
    </span>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-b-0">
      <span className="text-label uppercase tracking-widest text-text-tertiary">
        {label}
      </span>
      <span className="text-meta text-right text-text-primary">{value}</span>
    </div>
  );
}

export default function SubmissionDetail() {
  const { assignmentId, submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [submission, setSubmission] = useState(null);
  const [totalMarks, setTotalMarks] = useState("100");
  const [totalScore, setTotalScore] = useState("0");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [showPublish, setShowPublish] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!submissionId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const { data } = await getSubmissionDetail(submissionId);
      const nextSubmission = data.submission;
      setSubmission(nextSubmission);
      setTotalMarks(String(nextSubmission.totalMarks ?? 100));
      setTotalScore(String(nextSubmission.totalScore ?? 0));
      setFeedback(nextSubmission.feedback || "");
      setLastSavedAt(nextSubmission.gradedAt || null);
    } catch (err) {
      setError(err.message || "Couldn't load submission.");
    } finally {
      setIsLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const submissionIds = useMemo(() => {
    const fromState = location.state?.submissionIds;
    if (Array.isArray(fromState) && fromState.length > 0) {
      return fromState.map(String);
    }

    try {
      const raw = sessionStorage.getItem(`submission_list_${assignmentId}`);
      return raw ? JSON.parse(raw).map(String) : [];
    } catch {
      return [];
    }
  }, [assignmentId, location.state?.submissionIds]);

  const currentIndex = submissionIds.indexOf(String(submissionId));
  const prevId = currentIndex > 0 ? submissionIds[currentIndex - 1] : null;
  const nextId =
    currentIndex >= 0 && currentIndex < submissionIds.length - 1
      ? submissionIds[currentIndex + 1]
      : null;

  const parsedTotalMarks = Number(totalMarks);
  const parsedTotalScore = Number(totalScore);
  const percent = percentFromScore(
    Number.isFinite(parsedTotalScore) ? parsedTotalScore : 0,
    Number.isFinite(parsedTotalMarks) && parsedTotalMarks > 0
      ? parsedTotalMarks
      : 100,
  );
  const gradeLetter = gradeLetterFromPercent(percent);

  const isDirty =
    submission &&
    (String(submission.totalMarks ?? 100) !== totalMarks ||
      String(submission.totalScore ?? 0) !== totalScore ||
      (submission.feedback || "") !== feedback);

  const validateGrade = useCallback(() => {
    if (!Number.isFinite(parsedTotalMarks) || parsedTotalMarks <= 0) {
      setNotice("Total marks must be greater than zero.");
      return false;
    }

    if (!Number.isFinite(parsedTotalScore) || parsedTotalScore < 0) {
      setNotice("Score must be zero or greater.");
      return false;
    }

    if (parsedTotalScore > parsedTotalMarks) {
      setNotice("Score cannot exceed total marks.");
      return false;
    }

    return true;
  }, [parsedTotalMarks, parsedTotalScore]);

  const handleSaveGrade = useCallback(async () => {
    if (!submissionId || !validateGrade()) return;

    try {
      setIsSaving(true);
      setNotice("");

      await saveGrade(submissionId, {
        scores: [],
        totalScore: parsedTotalScore,
        totalMarks: parsedTotalMarks,
        feedback,
      });

      const gradedAt = new Date().toISOString();
      setLastSavedAt(gradedAt);
      setSubmission((current) =>
        current
          ? {
              ...current,
              totalScore: parsedTotalScore,
              totalMarks: parsedTotalMarks,
              feedback,
              reviewState: current.gradePublished ? "published" : "draft",
              gradedAt,
            }
          : current,
      );
      setNotice("Draft saved.");
    } catch (err) {
      setNotice(err.message || "Couldn't save grade.");
    } finally {
      setIsSaving(false);
    }
  }, [
    feedback,
    parsedTotalMarks,
    parsedTotalScore,
    submissionId,
    validateGrade,
  ]);

  const handlePublish = useCallback(async () => {
    if (!submissionId || !validateGrade()) return;

    try {
      setIsPublishing(true);
      setNotice("");

      await saveGrade(submissionId, {
        scores: [],
        totalScore: parsedTotalScore,
        totalMarks: parsedTotalMarks,
        feedback,
      });
      await publishGrade(submissionId);

      const publishedAt = new Date().toISOString();
      setSubmission((current) =>
        current
          ? {
              ...current,
              totalScore: parsedTotalScore,
              totalMarks: parsedTotalMarks,
              feedback,
              gradePublished: true,
              reviewState: "published",
              publishedAt,
            }
          : current,
      );

      sessionStorage.setItem(
        "submission_published",
        JSON.stringify({
          id: Number(submissionId),
          totalScore: parsedTotalScore,
        }),
      );

      setShowPublish(false);
      setNotice("Grade published.");

      if (nextId) {
        navigate(`/admin/assignments/${assignmentId}/submissions/${nextId}`, {
          replace: true,
          state: { submissionIds },
        });
      }
    } catch (err) {
      setNotice(err.message || "Couldn't publish grade.");
      setShowPublish(false);
    } finally {
      setIsPublishing(false);
    }
  }, [
    assignmentId,
    feedback,
    navigate,
    nextId,
    parsedTotalMarks,
    parsedTotalScore,
    submissionId,
    submissionIds,
    validateGrade,
  ]);

  useEffect(() => {
    const handler = (event) => {
      const tag = document.activeElement?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA";

      if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSaveGrade();
      }

      if (!inField && event.key === "ArrowLeft" && prevId) {
        navigate(`/admin/assignments/${assignmentId}/submissions/${prevId}`, {
          state: { submissionIds },
        });
      }

      if (!inField && event.key === "ArrowRight" && nextId) {
        navigate(`/admin/assignments/${assignmentId}/submissions/${nextId}`, {
          state: { submissionIds },
        });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [assignmentId, handleSaveGrade, navigate, nextId, prevId, submissionIds]);

  return (
    <PageShell
      title="Review submission"
      subtitle={
        submission?.assignmentTitle || "Grade and publish this group submission"
      }
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => navigate(-1)} className="btn-secondary btn-sm">
            <ArrowLeft size={14} aria-hidden="true" />
            Back
          </button>
          <button
            onClick={() =>
              prevId &&
              navigate(
                `/admin/assignments/${assignmentId}/submissions/${prevId}`,
                {
                  state: { submissionIds },
                },
              )
            }
            className="btn-secondary btn-sm"
            disabled={!prevId}
          >
            Previous
          </button>
          <button
            onClick={() =>
              nextId &&
              navigate(
                `/admin/assignments/${assignmentId}/submissions/${nextId}`,
                {
                  state: { submissionIds },
                },
              )
            }
            className="btn-secondary btn-sm"
            disabled={!nextId}
          >
            Next
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="card p-6 animate-pulse">
          <div className="h-4 w-40 bg-surface-overlay rounded mb-4" />
          <div className="h-28 bg-surface-overlay rounded" />
        </div>
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchDetail} />
      ) : !submission ? (
        <EmptyState
          title="Submission missing"
          description="This submission is no longer available."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-6">
            <div className="space-y-6">
              <div className="card p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge submission={submission} />
                      {submission.isLate ? (
                        <span className="badge badge-warning">Late work</span>
                      ) : null}
                      <span className="badge badge-neutral">
                        {submission.submittedMembers}/{submission.memberCount}{" "}
                        members submitted
                      </span>
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-text-primary">
                      {submission.groupName}
                    </h2>
                    <p className="mt-2 text-meta text-text-secondary">
                      Reviewed under {submission.assignmentTitle}
                    </p>
                  </div>

                  <a
                    href={submission.onedriveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary btn-sm w-full sm:w-auto"
                  >
                    Open submission folder
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card p-4 bg-surface-overlay/50 border-border/70 shadow-none">
                    <p className="text-label uppercase tracking-widest text-text-tertiary">
                      Group lead
                    </p>
                    <p className="mt-2 text-body font-medium text-text-primary">
                      {submission.student.name}
                    </p>
                    <p className="mt-1 text-label text-text-tertiary">
                      {submission.student.email || "No email available"}
                    </p>
                  </div>

                  <div className="card p-4 bg-surface-overlay/50 border-border/70 shadow-none">
                    <p className="text-label uppercase tracking-widest text-text-tertiary">
                      Timeline
                    </p>
                    <div className="mt-2 space-y-2 text-meta text-text-secondary">
                      <p>
                        Due {dateTimeFmt.format(new Date(submission.dueDate))}
                      </p>
                      <p>
                        Submitted{" "}
                        {submission.submittedAt
                          ? dateTimeFmt.format(new Date(submission.submittedAt))
                          : "Not yet"}
                      </p>
                      <p>
                        Current state:{" "}
                        <span className="font-medium text-text-primary capitalize">
                          {submission.reviewState.replace(/_/g, " ")}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {submission.assignmentDescription ? (
                  <div className="mt-6 rounded-2xl border border-border bg-surface-overlay/45 p-4">
                    <p className="text-label uppercase tracking-widest text-text-tertiary">
                      Assignment brief
                    </p>
                    <p className="mt-2 text-meta leading-7 text-text-secondary">
                      {submission.assignmentDescription}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="card p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                    <Users size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-section text-text-primary">
                      Group roster
                    </h3>
                    <p className="text-label text-text-tertiary mt-1">
                      Submission and review status for every member
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {(submission.members || []).map((member) => (
                    <div
                      key={member.user_id}
                      className="rounded-2xl border border-border bg-surface-overlay/35 px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-body font-medium text-text-primary">
                            {member.full_name}
                          </p>
                          <p className="text-label text-text-tertiary mt-1">
                            {member.email}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="badge badge-neutral capitalize">
                            {member.role}
                          </span>
                          <span className="badge badge-neutral">
                            <MemberStatus member={member} />
                          </span>
                          {member.evaluation_status !== "ungraded" ? (
                            <span
                              className={`badge ${
                                member.evaluation_status === "accepted"
                                  ? "badge-success"
                                  : "badge-danger"
                              } capitalize`}
                            >
                              {member.evaluation_status}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {member.feedback ? (
                        <p className="mt-3 text-label text-text-secondary">
                          {member.feedback}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                    <Clock3 size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-section text-text-primary">
                      Submission activity
                    </h3>
                    <p className="text-label text-text-tertiary mt-1">
                      Link open history for this group
                    </p>
                  </div>
                </div>

                {(submission.clickLog || []).length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {submission.clickLog.map((event, index) => (
                      <div
                        key={`${event.email}-${event.clicked_at}-${index}`}
                        className="rounded-2xl border border-border bg-surface-overlay/35 px-4 py-4 flex items-start justify-between gap-4"
                      >
                        <div>
                          <p className="text-body font-medium text-text-primary">
                            {event.full_name}
                          </p>
                          <p className="text-label text-text-tertiary mt-1">
                            {event.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-meta text-text-primary">
                            {timeAgo(event.clicked_at)}
                          </p>
                          <p className="text-label text-text-tertiary mt-1">
                            {dateTimeFmt.format(new Date(event.clicked_at))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No activity yet"
                    description="Link opens will appear here once students access the folder."
                  />
                )}
              </div>
            </div>

            <div className="space-y-4 xl:sticky xl:top-6 self-start">
              <div className="card p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-label uppercase tracking-widest text-text-tertiary">
                      Grade summary
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold text-text-primary">
                      {Number.isFinite(parsedTotalScore) ? parsedTotalScore : 0}
                      <span className="text-text-tertiary font-normal">
                        {" "}
                        /{" "}
                        {Number.isFinite(parsedTotalMarks) &&
                        parsedTotalMarks > 0
                          ? parsedTotalMarks
                          : 100}
                      </span>
                    </h3>
                    <p className="mt-2 text-meta text-text-secondary">
                      {percent}% · {gradeLetter}
                    </p>
                  </div>
                  <div className="badge badge-success">{gradeLetter}</div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-label uppercase tracking-widest text-text-tertiary">
                        Total marks
                      </span>
                      <input
                        id="submission-total-marks"
                        name="totalMarks"
                        type="number"
                        min="1"
                        value={totalMarks}
                        onChange={(event) => setTotalMarks(event.target.value)}
                        className="input-field mt-2"
                      />
                    </label>

                    <label className="block">
                      <span className="text-label uppercase tracking-widest text-text-tertiary">
                        Awarded score
                      </span>
                      <input
                        id="submission-awarded-score"
                        name="awardedScore"
                        type="number"
                        min="0"
                        value={totalScore}
                        onChange={(event) => setTotalScore(event.target.value)}
                        className="input-field mt-2"
                      />
                    </label>
                  </div>

                  <div className="h-2 rounded-full bg-surface-overlay overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percent >= 75
                          ? "bg-semantic-success"
                          : percent >= 50
                            ? "bg-semantic-warning"
                            : "bg-semantic-danger"
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-overlay/35 p-4">
                    <SummaryRow
                      label="Visibility"
                      value={
                        submission.gradePublished
                          ? "Published to students"
                          : "Draft only"
                      }
                    />
                    <SummaryRow
                      label="Group review"
                      value={
                        submission.evaluationStatus === "ungraded"
                          ? "Pending"
                          : submission.evaluationStatus
                      }
                    />
                    <SummaryRow
                      label="Last saved"
                      value={
                        lastSavedAt ? timeAgo(lastSavedAt) : "Not saved yet"
                      }
                    />
                  </div>
                </div>
              </div>

              <FeedbackComposer
                submissionId={submissionId}
                value={feedback}
                onChange={setFeedback}
              />

              {notice ? (
                <div className="card p-4 border border-border bg-surface-overlay/35">
                  <div className="flex items-center gap-2 text-text-primary">
                    <CheckCircle2
                      size={16}
                      aria-hidden="true"
                      className="text-semantic-success"
                    />
                    <span className="text-meta">{notice}</span>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSaveGrade}
                  className="btn-secondary"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving draft..."
                    : isDirty
                      ? "Save draft"
                      : "Draft saved"}
                </button>
                <button
                  onClick={() => setShowPublish(true)}
                  className="btn-primary"
                  disabled={isPublishing}
                >
                  Publish grade
                </button>
              </div>
            </div>
          </div>

          <Modal
            isOpen={showPublish}
            onClose={() => setShowPublish(false)}
            title="Publish grade"
            size="sm"
          >
            <p className="text-meta text-text-secondary">
              Students will see the score, total marks, and written feedback
              once you publish.
            </p>
            <div className="mt-4 rounded-2xl border border-border bg-surface-overlay/45 p-4">
              <p className="text-body font-medium text-text-primary">
                {submission.groupName}
              </p>
              <p className="mt-1 text-label text-text-tertiary">
                {parsedTotalScore} / {parsedTotalMarks} · {percent}%
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPublish(false)}
                className="btn-secondary btn-sm"
                disabled={isPublishing}
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="btn-primary btn-sm"
                disabled={isPublishing}
              >
                {isPublishing ? "Publishing..." : "Publish now"}
              </button>
            </div>
          </Modal>
        </>
      )}
    </PageShell>
  );
}
