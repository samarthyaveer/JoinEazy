import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import EmptyState from "@/components/common/EmptyState";

const ranges = [
  [0, 10],
  [11, 20],
  [21, 30],
  [31, 40],
  [41, 50],
  [51, 60],
  [61, 70],
  [71, 80],
  [81, 90],
  [91, 100],
];

const toLabel = (min, max) => `${min}-${max}`;

const bucketScores = (scores) =>
  ranges.map(([min, max]) => ({
    label: toLabel(min, max),
    min,
    max,
    count: scores.filter((s) => s >= min && s <= max).length,
  }));

export default function ScoreDistributionChart({ scores = [], averageScore }) {
  const cleanScores = scores.filter((s) => typeof s === "number");
  const data = bucketScores(cleanScores);
  const hasData = cleanScores.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        title="No submissions"
        description="Submissions show up here."
      />
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-section text-text-primary">Score spread</h3>
        <span className="text-label text-text-tertiary">
          Average:{" "}
          {averageScore?.toFixed ? averageScore.toFixed(1) : averageScore}
        </span>
      </div>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 12 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#A0A0A0" }} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11, fill: "#A0A0A0" }}
              width={54}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const entry = payload[0].payload;
                return (
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 12,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                      fontSize: 12,
                      padding: "8px 10px",
                    }}
                  >
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>
                      {entry.label}
                    </p>
                    <p>{entry.count} students in this range</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 8, 8]}>
              {data.map((entry) => {
                const mid = (entry.min + entry.max) / 2;
                const isAbove =
                  typeof averageScore === "number" && mid >= averageScore;
                return (
                  <Cell
                    key={entry.label}
                    fill={
                      isAbove ? "rgba(22,163,74,0.65)" : "rgba(217,119,6,0.6)"
                    }
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-label text-text-tertiary mt-3">
        Tip: Above-average bars are green.
      </p>
    </div>
  );
}
