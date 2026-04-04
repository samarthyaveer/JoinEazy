import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Search from "lucide-react/dist/esm/icons/search";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import PageShell from "@/components/layout/PageShell";
import EmptyState from "@/components/common/EmptyState";
import ErrorBanner from "@/components/common/ErrorBanner";
import Modal from "@/components/common/Modal";
import { getSubmissions, bulkPublishGrades } from "@/services/api";
import { timeAgo } from "@/utils/time";

const FILTERS = [
  { id: "all", label: "All work" },
  { id: "ungraded", label: "Needs grading" },
  { id: "draft", label: "Drafts" },
  { id: "graded", label: "Published" },
  { id: "late", label: "Late work" },
];

export default function SubmissionReview() {
  const { assignmentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");

  const fetchSubmissions = useCallback(async () => {
    if (!assignmentId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await getSubmissions(assignmentId);
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err.message || "Couldn't load submissions.");
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    const paramFilter = searchParams.get("filter");
    if (paramFilter && FILTERS.some((f) => f.id === paramFilter)) {
      setFilter(paramFilter);
    }
  }, [searchParams]);

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    if (!assignmentId) return;
    const published = sessionStorage.getItem("submission_published");
    if (!published) return;
    try {
      const parsed = JSON.parse(published);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === parsed.id
            ? { ...s, status: "published", totalScore: parsed.totalScore }
            : s,
        ),
      );
      sessionStorage.removeItem("submission_published");
    } catch {
      sessionStorage.removeItem("submission_published");
    }
  }, [assignmentId]);

  const filtered = useMemo(() => {
    let list = submissions.slice();

    if (filter === "graded") {
      list = list.filter((s) => s.status === "published");
    } else if (filter === "draft") {
      list = list.filter((s) => s.status === "draft");
    } else if (filter === "ungraded") {
      list = list.filter((s) => s.status === "ungraded");
    } else if (filter === "late") {
      list = list.filter((s) => s.isLate);
    }

    if (search) {
      list = list.filter((s) =>
        `${s.studentName} ${s.groupName || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
    }

    if (sort === "oldest") {
      list.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
    } else if (sort === "name") {
      list.sort((a, b) => a.studentName.localeCompare(b.studentName));
    } else {
      list.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    }

    return list;
  }, [filter, search, sort, submissions]);

  useEffect(() => {
    if (!assignmentId) return;
    sessionStorage.setItem(
      `submission_list_${assignmentId}`,
      JSON.stringify(filtered.map((s) => s.id)),
    );
  }, [filtered, assignmentId]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === filtered.length) return new Set();
      return new Set(filtered.map((s) => s.id));
    });
  };

  const handleRowClick = (submissionId) => {
    navigate(`/admin/assignments/${assignmentId}/submissions/${submissionId}`, {
      state: {
        submissionIds: filtered.map((s) => s.id),
      },
    });
  };

  const handleBulkConfirm = async () => {
    setNotice("");
    if (!bulkAction) return;
    const ids = Array.from(selectedIds);

    try {
      if (bulkAction === "publish") {
        const publishableIds = filtered
          .filter((submission) => ids.includes(submission.id))
          .filter((submission) => submission.status === "draft")
          .map((submission) => submission.id);

        if (!publishableIds.length) {
          setNotice("Select submissions with saved draft grades first.");
          setShowBulkModal(false);
          return;
        }

        const { data } = await bulkPublishGrades(publishableIds);
        setSubmissions((prev) =>
          prev.map((s) =>
            publishableIds.includes(s.id) ? { ...s, status: "published" } : s,
          ),
        );
        setNotice(
          data?.succeeded
            ? `${data.succeeded} grade${data.succeeded === 1 ? "" : "s"} released.`
            : "No draft grades were released.",
        );
      }
      setBulkAction("");
      setSelectedIds(new Set());
    } catch (err) {
      setNotice(err.message || "Bulk action failed. Try again.");
    } finally {
      setShowBulkModal(false);
    }
  };

  const selectedCount = selectedIds.size;
  const allSelected = filtered.length > 0 && selectedCount === filtered.length;

  return (
    <PageShell
      title="Review submissions"
      subtitle="Grade and publish work"
      action={
        <button onClick={() => navigate(-1)} className="btn-secondary btn-sm">
          <ArrowLeft size={14} aria-hidden="true" />
          Go back
        </button>
      }
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`btn-sm ${
                filter === f.id
                  ? "btn-primary"
                  : "btn-secondary text-text-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              aria-hidden="true"
            />
            <input
              id="submission-search"
              name="submissionSearch"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-field pl-9"
              placeholder="Search groups or students"
              aria-label="Search submissions"
            />
          </div>
          <select
            id="submission-sort"
            name="submissionSort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-field"
            aria-label="Sort submissions"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {notice ? (
        <div className="mb-4 text-meta text-text-secondary">{notice}</div>
      ) : null}

      {selectedCount > 0 ? (
        <div className="card p-4 flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="text-meta text-text-secondary">
            Selected: {selectedCount}
          </span>
          <div className="flex items-center gap-2">
            <select
              id="bulk-action"
              name="bulkAction"
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="input-field"
              aria-label="Select bulk action"
            >
              <option value="">Bulk action</option>
              <option value="publish">Release scores</option>
            </select>
            <button
              className="btn-primary btn-sm"
              onClick={() => setShowBulkModal(true)}
              disabled={!bulkAction}
            >
              Apply action
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="card p-6 animate-pulse">
          <div className="h-4 w-40 bg-surface-overlay rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-surface-overlay rounded" />
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchSubmissions} />
      ) : !filtered.length ? (
        <EmptyState
          title="No submissions"
          description="Submissions show up here."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-border bg-surface-overlay/60 text-label text-text-tertiary uppercase tracking-widest">
                <th className="px-4 py-3 text-left">
                  <input
                    id="select-all-submissions"
                    name="selectAllSubmissions"
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all submissions"
                  />
                </th>
                <th className="px-4 py-3 text-left">Group</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-left">Grade</th>
                <th className="px-4 py-3 text-left">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((submission) => {
                const scoreLabel =
                  typeof submission.totalScore === "number"
                    ? `${submission.totalScore}/${submission.totalMarks}`
                    : "Needs grade";

                return (
                  <tr
                    key={submission.id}
                    className="hover:bg-surface-overlay/40 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(submission.id)}
                  >
                    <td
                      className="px-4 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        id={`submission-select-${submission.id}`}
                        name={`submissionSelect-${submission.id}`}
                        type="checkbox"
                        checked={selectedIds.has(submission.id)}
                        onChange={() => toggleSelect(submission.id)}
                        aria-label={`Select ${submission.groupName || submission.studentName}`}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center text-meta font-semibold">
                          {submission.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-body font-medium text-text-primary">
                            {submission.groupName || submission.studentName}
                          </p>
                          <p className="text-label text-text-tertiary">
                            {submission.studentName}
                            {submission.studentEmail
                              ? ` · ${submission.studentEmail}`
                              : ""}
                          </p>
                          <p className="text-label text-text-tertiary">
                            {submission.submittedMembers}/{submission.memberCount} members submitted
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-meta text-text-secondary">
                      {submission.submitted_at
                        ? timeAgo(submission.submitted_at)
                        : "Not submitted"}
                    </td>
                    <td className="px-4 py-4">
                      {submission.status === "published" ||
                      submission.status === "draft" ? (
                        <span className="text-meta font-medium text-text-primary">
                          {scoreLabel}
                        </span>
                      ) : (
                        <span className="badge badge-warning">Needs grade</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {submission.status === "published" ? (
                          <span className="badge badge-success">Published</span>
                        ) : null}
                        {submission.status === "draft" ? (
                          <span className="badge badge-warning">Draft</span>
                        ) : null}
                        {submission.isLate ? (
                          <span className="badge badge-warning">Late work</span>
                        ) : null}
                        {submission.evaluationStatus !== "ungraded" ? (
                          <span
                            className={`badge ${
                              submission.evaluationStatus === "accepted"
                                ? "badge-success"
                                : "badge-danger"
                            } capitalize`}
                          >
                            {submission.evaluationStatus}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Confirm action"
        size="sm"
      >
        <p className="text-meta text-text-secondary">
          Apply "{bulkAction}" to {selectedCount} selected items? Only draft
          grades will be published.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowBulkModal(false)}
            className="btn-secondary btn-sm"
          >
            Back
          </button>
          <button onClick={handleBulkConfirm} className="btn-primary btn-sm">
            Apply
          </button>
        </div>
      </Modal>
    </PageShell>
  );
}
