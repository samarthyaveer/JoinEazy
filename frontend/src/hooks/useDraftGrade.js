import { useCallback, useEffect, useRef, useState } from "react";

const gradeKey = (submissionId) => `grade_draft_${submissionId}`;
const feedbackKey = (submissionId) => `feedback_draft_${submissionId}`;

export default function useDraftGrade(
  submissionId,
  initialScores = [],
  initialFeedback = "",
) {
  const [scores, setScores] = useState(initialScores);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    if (!submissionId) return;

    const draftRaw = localStorage.getItem(gradeKey(submissionId));
    const feedbackRaw = localStorage.getItem(feedbackKey(submissionId));

    if (draftRaw) {
      try {
        const parsed = JSON.parse(draftRaw);
        setScores(parsed.scores || initialScores);
        setFeedback(parsed.feedback ?? initialFeedback);
        setLastSaved(parsed.lastSaved || null);
      } catch {
        setScores(initialScores);
        setFeedback(initialFeedback);
      }
    } else {
      setScores(initialScores);
      setFeedback(initialFeedback);
    }

    if (feedbackRaw && !draftRaw) {
      setFeedback(feedbackRaw);
    }

    setIsDirty(false);
    skipSaveRef.current = true;
  }, [submissionId, initialScores, initialFeedback]);

  useEffect(() => {
    if (!submissionId) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    setIsDirty(true);
    const payload = {
      scores,
      feedback,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(gradeKey(submissionId), JSON.stringify(payload));
    setLastSaved(payload.lastSaved);
  }, [scores, feedback, submissionId]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const markSaved = useCallback(() => {
    setIsDirty(false);
  }, []);

  const clearDraft = useCallback(() => {
    if (!submissionId) return;
    localStorage.removeItem(gradeKey(submissionId));
    localStorage.removeItem(feedbackKey(submissionId));
  }, [submissionId]);

  return {
    scores,
    setScores,
    feedback,
    setFeedback,
    isDirty,
    lastSaved,
    markSaved,
    clearDraft,
  };
}
