import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import EmptyState from "@/components/common/EmptyState";

const truncate = (text, max = 60) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

const countWrongAnswers = (answers) => {
  const tally = {};
  for (const answer of answers) {
    if (answer.isCorrect) continue;
    const key = answer.answer || "(no answer)";
    tally[key] = (tally[key] || 0) + 1;
  }
  let top = null;
  let topCount = 0;
  Object.entries(tally).forEach(([answer, count]) => {
    if (count > topCount) {
      top = answer;
      topCount = count;
    }
  });
  return top;
};

export default function QuestionBreakdown({ questions = [] }) {
  const [openId, setOpenId] = useState(null);

  const items = useMemo(
    () =>
      questions.map((q) => {
        const total = q.answers?.length || 0;
        const correct = q.answers?.filter((a) => a.isCorrect).length || 0;
        const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { ...q, total, correct, percent };
      }),
    [questions],
  );

  if (!items.length) {
    return (
      <EmptyState
        title="No question data yet"
        description="Insights show up after grading."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((q) => {
        const wrongAnswer = countWrongAnswers(q.answers || []);
        const chartData = [
          { name: "Correct", value: q.correct },
          { name: "Wrong", value: q.total - q.correct },
        ];

        return (
          <div key={q.id} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(openId === q.id ? null : q.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div>
                <p className="text-body font-medium text-text-primary">
                  {truncate(q.text)}
                </p>
                <p className="text-label text-text-tertiary mt-1">
                  {q.correct}/{q.total} right
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge badge-success">{q.percent}%</span>
                {openId === q.id ? (
                  <ChevronUp size={16} aria-hidden="true" />
                ) : (
                  <ChevronDown size={16} aria-hidden="true" />
                )}
              </div>
            </button>

            {openId === q.id ? (
              <div className="border-t border-border px-5 py-5 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
                <div>
                  <p className="text-meta text-text-tertiary uppercase tracking-widest">
                    Question text
                  </p>
                  <p className="text-body text-text-primary mt-2">{q.text}</p>

                  <div className="mt-4 space-y-3">
                    <div className="p-3 rounded-xl border border-semantic-success/20 bg-semantic-success/5">
                      <p className="text-label text-semantic-success uppercase tracking-widest">
                        Answer key
                      </p>
                      <p className="text-body text-text-primary mt-1">
                        {q.correctAnswer}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-semantic-danger/20 bg-semantic-danger/5">
                      <p className="text-label text-semantic-danger uppercase tracking-widest">
                        Top wrong answer
                      </p>
                      <p className="text-body text-text-primary mt-1">
                        {wrongAnswer || "No wrong answers"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-label text-text-tertiary uppercase tracking-widest mb-3">
                      Student responses
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[420px]">
                        <thead>
                          <tr className="text-label text-text-tertiary uppercase tracking-widest border-b border-border">
                            <th className="text-left py-2">Student name</th>
                            <th className="text-left py-2">Response</th>
                            <th className="text-right py-2">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {(q.answers || []).map((a) => (
                            <tr key={`${q.id}-${a.studentId}`}>
                              <td className="py-2 text-meta text-text-primary">
                                {a.studentName}
                              </td>
                              <td className="py-2 text-meta text-text-secondary">
                                {a.answer || "(no answer)"}
                              </td>
                              <td className="py-2 text-right text-meta text-text-secondary font-mono">
                                {a.score}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="card p-4 h-fit">
                  <p className="text-label text-text-tertiary uppercase tracking-widest mb-2">
                    Correct vs wrong
                  </p>
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                        >
                          <Cell fill="rgba(22,163,74,0.6)" />
                          <Cell fill="rgba(220,38,38,0.5)" />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#FFFFFF",
                            border: "1px solid rgba(0,0,0,0.08)",
                            borderRadius: 12,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between text-label text-text-tertiary mt-2">
                    <span>Correct: {q.correct}</span>
                    <span>Wrong: {q.total - q.correct}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
