import { useEffect, useMemo, useState } from "react";

const MAX_CHARS = 2000;
const CHIPS = [
  "Nice effort",
  "Needs work",
  "Clear structure",
  "Review chapter 1",
];

const escapeHtml = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderMarkdown = (text) => {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br />");
};

export default function FeedbackComposer({ submissionId, value, onChange }) {
  const [preview, setPreview] = useState(false);

  const counterTone =
    value.length > MAX_CHARS * 0.8
      ? "text-semantic-warning"
      : "text-text-tertiary";

  useEffect(() => {
    if (!submissionId) return;
    const handle = setTimeout(() => {
      localStorage.setItem(`feedback_draft_${submissionId}`, value);
    }, 1000);
    return () => clearTimeout(handle);
  }, [submissionId, value]);

  const previewHtml = useMemo(() => renderMarkdown(value), [value]);

  const handleChip = (text) => {
    const next = value ? `${value}\n${text}` : text;
    onChange(next);
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-section text-text-primary">Feedback notes</h3>
        <button
          type="button"
          onClick={() => setPreview((prev) => !prev)}
          className="text-label text-accent font-medium"
        >
          {preview ? "Edit notes" : "Preview notes"}
        </button>
      </div>

      {preview ? (
        <div
          className="min-h-[120px] border border-border rounded-xl p-3 text-sm text-text-primary bg-surface-raised"
          dangerouslySetInnerHTML={{
            __html: previewHtml || "<p>Nothing to preview yet.</p>",
          }}
        />
      ) : (
        <textarea
          id={`feedback-notes-${submissionId || "draft"}`}
          name="feedbackNotes"
          rows={4}
          maxLength={MAX_CHARS}
          className="input-field min-h-[140px]"
          placeholder="Write feedback for the student..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChip(chip)}
            className="badge badge-neutral"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className={`text-right text-label mt-3 ${counterTone}`}>
        {value.length} / {MAX_CHARS}
      </div>
    </div>
  );
}
