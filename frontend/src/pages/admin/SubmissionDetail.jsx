import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Keyboard from "lucide-react/dist/esm/icons/keyboard";
import PageShell from "@/components/layout/PageShell";
import ErrorBanner from "@/components/common/ErrorBanner";
import EmptyState from "@/components/common/EmptyState";
import Modal from "@/components/common/Modal";
import InlineGradingPanel from "@/components/admin/InlineGradingPanel";
import FeedbackComposer from "@/components/admin/FeedbackComposer";
import { getSubmissionDetail, publishGrade, saveGrade } from "@/services/api";
import useDraftGrade from "@/hooks/useDraftGrade";
import { gradeLetterFromPercent, percentFromScore } from "@/utils/grade";
import { timeAgo } from "@/utils/time";

// ─── Keyboard hint tooltip ────────────────────────────────────────────────────
function KeyboardHint() {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-overlay transition-colors"
        aria-label="Keyboard shortcuts"
      >
        <Keyboard size={15} aria-hidden="true" />
      </button>
      {visible && (
        <div className="absolute right-0 top-10 z-50 w-56 card p-4 shadow-xl text-label space-y-2">
          <p className="text-text-tertiary uppercase tracking-widest text-[10px] font-medium mb-3">
            Shortcuts
          </p>
          {[
            ["Ctrl + S", "Save draft"],
            ["Ctrl + Enter", "Publish score"],
            ["← / →", "Prev / Next student"],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="font-mono bg-surface-overlay px-2 py-0.5 rounded text-text-secondary text-[11px]">
                {key}
              </span>
              <span className="text-text-secondary">{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Grade badge ──────────────────────────────────────────────────────────────
function GradeBadge({ letter }) {
  const colours = {
    A: "bg-semantic-success/10 text-semantic-success border-semantic-success/20",
    B: "bg-blue-50 text-blue-600 border-blue-200",
    C: "bg-amber-50 text-amber-600 border-amber-200",
    D: "bg-orange-50 text-orange-600 border-orange-200",
    F: "bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border text-body font-bold ${colours[letter] || colours.C}`}
    >
      {letter}
    </span>
  );
}

// ─── Auto-save status indicator ───────────────────────────────────────────────
function SaveStatus({ isDirty, isSaving, lastSaved }) {
  if (isSaving) {
    return (
      <span className="text-label text-text-tertiary animate-pulse">
        Saving…
      </span>
    );
  }
  if (isDirty) {
    return (
      <span className="text-label text-semantic-warning">Unsaved changes</span>
    );
  }
  if (lastSaved) {
    return (
      <span className="text-label text-semantic-success">
        Saved {timeAgo(lastSaved)}
      </span>
    );
  }
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SubmissionDetail() {
  const { assignmentId, submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [submission, setSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [showPublish, setShowPublish] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // ── Fetch submission ────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async () => {
    if (!submissionId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await getSubmissionDetail(submissionId);
      setSubmission(data.submission);
    } catch (err) {
      setError(err.message || "Couldn't load submission.");
    } finally {
      setIsLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // ── Draft grades ────────────────────────────────────────────────────────────
  const initialScores = useMemo(() => {
    if (!submission?.questions) return [];
    return submission.questions.map((q) => ({
      questionId: q.id,
      score: q.autoScore ?? 0,
      comment: "",
    }));
  }, [submission]);

  const {
    scores,
    setScores,
    feedback,
    setFeedback,
    isDirty,
    lastSaved,
    markSaved,
    clearDraft,
  } = useDraftGrade(submissionId, initialScores, submission?.feedback || "");

  // ── Score calculations ──────────────────────────────────────────────────────
  const questionList = submission?.questions || [];
  const totalMarks =
    submission?.totalMarks ||
    questionList.reduce((acc, q) => acc + q.maxMarks, 0);
  const totalScore = scores.reduce((acc, s) => acc + (s.score || 0), 0);
  const percent = percentFromScore(totalScore, totalMarks);
  const gradeLetter = gradeLetterFromPercent(percent);

  // ── Navigation list ─────────────────────────────────────────────────────────
  // Normalise to strings so indexOf comparison works regardless of API type
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

  // ── Save grade ──────────────────────────────────────────────────────────────
  const handleSaveGrade = useCallback(async () => {
    if (!submissionId) return;
    setIsSaving(true);
    setNotice("");
    try {
      await saveGrade(submissionId, {
        scores: scores.map((s) => ({
          questionId: s.questionId,
          score: s.score,
          comment: s.comment,
        })),
        totalScore,
        feedback,
      });
      markSaved();
      setNotice("Draft saved");
      setTimeout(() => setNotice(""), 2500);
    } catch (err) {
      setNotice(err.message || "Couldn't save grade.");
    } finally {
      setIsSaving(false);
    }
  }, [submissionId, scores, totalScore, feedback, markSaved]);

  // ── Auto-save: 3 s after last change ────────────────────────────────────────
  const saveRef = useRef(null);
  saveRef.current = handleSaveGrade;

  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => saveRef.current?.(), 3000);
    return () => clearTimeout(timer);
  }, [scores, feedback, isDirty]);

  // ── Publish grade ───────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      await saveGrade(submissionId, {
        scores: scores.map((s) => ({
          questionId: s.questionId,
          score: s.score,
          comment: s.comment,
        })),
        totalScore,
        feedback,
      });
      await publishGrade(submissionId);
      clearDraft();
      markSaved();

      sessionStorage.setItem(
        "submission_published",
        JSON.stringify({ id: String(submissionId), totalScore })
      );

      setShowPublish(false);

      // Auto-advance to next submission if one exists
      if (nextId) {
        navigate(
          `/admin/assignments/${assignmentId}/submissions/${nextId}`,
          { replace: true, state: { submissionIds } }
        );
      } else {
        navigate(`/admin/assignments/${assignmentId}/submissions`);
      }
    } catch (err) {
      setNotice(err.message || "Couldn't publish grade.");
      setIsPublishing(false);
      setShowPublish(false);
    }
  }, [
    submissionId,
    scores,
    totalScore,
    feedback,
    markSaved,
    clearDraft,
    nextId,
    navigate,
    assignmentId,
    submissionIds,
  ]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveRef.current?.();
        return;
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        setShowPublish(true);
        return;
      }
      // Arrow navigation only when not typing
      if (!inField) {
        if (e.key === "ArrowLeft" && prevId) {
          navigate(`/admin/assignments/${assignmentId}/submissions/${prevId}`, {
            state: { submissionIds },
          });
        } else if (e.key === "ArrowRight" && nextId) {
          navigate(`/admin/assignments/${assignmentId}/submissions/${nextId}`, {
            state: { submissionIds },
          });
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevId, nextId, navigate, assignmentId, submissionIds]);

  // ── Score update helper ─────────────────────────────────────────────────────
  const updateScore = (questionId, changes) => {
    setScores((prev) => {
      const next = prev.map((entry) =>
        entry.questionId === questionId ? { ...entry, ...changes } : entry
      );
      if (!next.find((entry) => entry.questionId === questionId)) {
        next.push({ questionId, score: 0, comment: "", ...changes });
      }
      return next;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Submission details"
      subtitle={submission?.assignmentTitle || "Review and score"}
      action={
        <div className="flex items-center gap-2">
          <KeyboardHint />
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary btn-sm"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Go back
          </button>
          <button
            onClick={() =>
              prevId &&
              navigate(
                `/admin/assignments/${assignmentId}/submissions/${prevId}`,
                { state: { submissionIds } }
              )
            }
            className="btn-secondary btn-sm"
            disabled={!prevId}
            title="Previous student (←)"
          >
            Previous
          </button>
          <button
            onClick={() =>
              nextId &&
              navigate(
                `/admin/assignments/${assignmentId}/submissions/${nextId}`,
                { state: { submissionIds } }
              )
            }
            className="btn-secondary btn-sm"
            disabled={!nextId}
            title="Next student (→)"
          >
            Next one
            <ArrowRight size={14} aria-hidden="true" />
          </button>
          {currentIndex >= 0 && submissionIds.length > 0 && (
            <span className="text-label text-text-tertiary font-mono tabular-nums hidden sm:inline">
              {currentIndex + 1} / {submissionIds.length}
            </span>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="card p-6 animate-pulse">
          <div className="h-4 w-32 bg-surface-overlay rounded mb-4" />
          <div className="h-24 bg-surface-overlay rounded" />
        </div>
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchDetail} />
      ) : !submission ? (
        <EmptyState
          title="Submission missing"
          description="This submission isn't available."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          {/* ── Left: student answers ── */}
          <div className="space-y-6">
            {/* Student info */}
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-meta font-semibold select-none">
                    {submission.student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-primary">
                      {submission.student.name}
                    </p>
                    <p className="text-label text-text-tertiary">
                      {submission.student.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-label text-text-tertiary">
                    Submitted {timeAgo(submission.submitted_at)}
                  </p>
                  {submission.isLate && (
                    <span className="badge badge-warning mt-2">Late work</span>
                  )}
                </div>
              </div>
            </div>

            {/* Regrade request banner */}
            {submission.regradeRequested && (
              <div className="card p-4 border border-purple-200 bg-purple-50">
                <p className="text-meta font-medium text-purple-800">
                  Regrade requested
                </p>
                <p className="text-label text-purple-700 mt-2">
                  {submission.regradeReason || "No reason provided."}
                </p>
              </div>
            )}

            {/* Questions */}
            {questionList.map((q, idx) => {
              const scoreEntry = scores.find((s) => s.questionId === q.id);
              const awarded = scoreEntry?.score ?? q.autoScore ?? 0;
              const isAdjusted = awarded !== (q.autoScore ?? 0);

              return (
                <div key={q.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <h3 className="text-section text-text-primary">
                      Q{idx + 1}. {q.text}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {isAdjusted && (
                        <span className="badge badge-warning text-[10px]">
                          Adjusted
                        </span>
                      )}
                      <span className="badge badge-neutral font-mono tabular-nums">
                        {awarded} / {q.maxMarks}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div
                      className={`p-3 rounded-xl border ${
                        q.isCorrect
                          ? "border-semantic-success/20 bg-semantic-success/5"
                          : q.studentAnswer
                            ? "border-semantic-danger/20 bg-semantic-danger/5"
                            : "border-border bg-white"
                      }`}
                    >
                      <p className="text-label text-text-tertiary uppercase tracking-widest">
                        Student response
                      </p>
                      <p className="text-body text-text-primary mt-2">
                        {q.studentAnswer || (
                          <span className="text-text-tertiary italic">
                            No answer given
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-semantic-success/20 bg-semantic-success/5">
                      <p className="text-label text-semantic-success uppercase tracking-widest">
                        Correct answer
                      </p>
                      <p className="text-body text-text-primary mt-2">
                        {q.correctAnswer}
                      </p>
                    </div>
                  </div>

                  {!q.isCorrect && q.mostCommonWrong && (
                    <p className="text-label text-text-tertiary mt-3">
                      Most common wrong answer:{" "}
                      <span className="font-medium text-text-secondary">
                        "{q.mostCommonWrong}"
                      </span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Right: grading panel ── */}
          <div className="space-y-4 lg:sticky lg:top-6 self-start">
            {/* Score summary */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-label text-text-tertiary uppercase tracking-widest">
                  Score summary
                </p>
                <GradeBadge letter={gradeLetter} />
              </div>
              <h3 className="text-2xl font-bold text-text-primary tabular-nums">
                {totalScore}
                <span className="text-text-tertiary font-normal">
                  {" "}
                  / {totalMarks}
                </span>
                <span className="text-lg font-medium text-text-secondary ml-2">
                  ({percent}%)
                </span>
              </h3>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percent >= 60
                      ? "bg-semantic-success"
                      : percent >= 40
                        ? "bg-semantic-warning"
                        : "bg-semantic-danger"
                  }`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <SaveStatus
                  isDirty={isDirty}
                  isSaving={isSaving}
                  lastSaved={lastSaved}
                />
              </div>
            </div>

            <InlineGradingPanel
              questions={questionList}
              scores={scores}
              onUpdate={updateScore}
            />

            <FeedbackComposer
              submissionId={submissionId}
              value={feedback}
              onChange={setFeedback}
            />

            {notice && (
              <p className="text-meta text-text-secondary">{notice}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSaveGrade}
                className="btn-secondary"
                disabled={isSaving}
                title="Ctrl + S"
              >
                {isSaving ? "Saving…" : "Save draft"}
              </button>
              <button
                onClick={() => setShowPublish(true)}
                className="btn-primary flex-1"
                disabled={isPublishing || scores.length === 0}
                title="Ctrl + Enter"
              >
                Publish score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Publish confirmation modal ── */}
      <Modal
        isOpen={showPublish}
        onClose={() => setShowPublish(false)}
        title="Publish score"
        size="sm"
      >
        <p className="text-meta text-text-secondary">
          This will make the grade visible to{" "}
          <span className="font-medium text-text-primary">
            {submission?.student?.name}
          </span>
          .
        </p>
        <div className="mt-4 flex items-center gap-4 p-4 rounded-xl bg-surface-overlay">
          <GradeBadge letter={gradeLetter} />
          <div>
            <p className="text-body font-bold text-text-primary tabular-nums">
              {totalScore} / {totalMarks} ({percent}%)
            </p>
            <p className="text-label text-text-tertiary mt-0.5">
              {gradeLetter} grade
            </p>
          </div>
        </div>
        {!feedback && (
          <div className="mt-4 p-3 rounded-xl bg-semantic-warning/10 border border-semantic-warning/20 text-semantic-warning text-label">
            No feedback written yet. Consider adding a note before publishing.
          </div>
        )}
        {feedback && (
          <div className="mt-4">
            <p className="text-label text-text-tertiary uppercase tracking-widest mb-1">
              Feedback preview
            </p>
            <p className="text-meta text-text-secondary line-clamp-3">
              {feedback}
            </p>
          </div>
        )}
        {nextId && (
          <p className="mt-3 text-label text-text-tertiary">
            You'll be taken to the next student automatically.
          </p>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowPublish(false)}
            className="btn-secondary btn-sm"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            className="btn-primary btn-sm"
            disabled={isPublishing}
          >
            {isPublishing ? "Publishing…" : "Publish score"}
          </button>
        </div>
      </Modal>
    </PageShell>
  );
}
