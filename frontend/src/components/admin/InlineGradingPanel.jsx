import Check from "lucide-react/dist/esm/icons/check";
import Minus from "lucide-react/dist/esm/icons/minus";
import X from "lucide-react/dist/esm/icons/x";

const getStatus = (score, max) => {
  if (score === max) return "full";
  if (score === 0) return "zero";
  return "partial";
};

export default function InlineGradingPanel({ questions, scores, onUpdate }) {
  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const entry = scores.find((s) => s.questionId === q.id) || {
          score: q.autoScore || 0,
          comment: "",
        };
        const status = getStatus(entry.score, q.maxMarks);

        return (
          <div key={q.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label text-text-tertiary uppercase tracking-widest">
                  Question {idx + 1}
                </p>
                <p className="text-body text-text-primary mt-1 line-clamp-2">
                  {q.text}
                </p>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  status === "full"
                    ? "bg-semantic-success/10 text-semantic-success"
                    : status === "zero"
                      ? "bg-semantic-danger/10 text-semantic-danger"
                      : "bg-semantic-warning/10 text-semantic-warning"
                }`}
              >
                {status === "full" ? (
                  <Check size={14} aria-hidden="true" />
                ) : status === "zero" ? (
                  <X size={14} aria-hidden="true" />
                ) : (
                  <Minus size={14} aria-hidden="true" />
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3 items-start">
              <div>
                <label
                  className="block text-label text-text-tertiary uppercase tracking-widest"
                  htmlFor={`score-${q.id}`}
                >
                  Points
                </label>
                <input
                  id={`score-${q.id}`}
                  type="number"
                  min={0}
                  max={q.maxMarks}
                  className="input-field mt-2"
                  value={entry.score}
                  onChange={(e) =>
                    onUpdate(q.id, {
                      score: Math.min(
                        Math.max(Number(e.target.value) || 0, 0),
                        q.maxMarks,
                      ),
                    })
                  }
                />
                <p className="text-label text-text-tertiary mt-1">
                  of {q.maxMarks}
                </p>
              </div>
              <div>
                <label
                  className="block text-label text-text-tertiary uppercase tracking-widest"
                  htmlFor={`comment-${q.id}`}
                >
                  Note (optional)
                </label>
                <textarea
                  id={`comment-${q.id}`}
                  rows={2}
                  className="input-field mt-2"
                  placeholder="Optional note"
                  value={entry.comment}
                  onChange={(e) =>
                    onUpdate(q.id, {
                      comment: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
