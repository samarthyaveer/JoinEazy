import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import PageShell from "@/components/layout/PageShell";
import { Spinner } from "@/components/common/UIComponents";
import { gsap, prefersReducedMotion, DURATION, EASE } from "@/lib/gsapConfig";
import { useMagnetic } from "@/hooks/useGsap";
import { adminApi } from "@/services/api";

export default function AssignmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    onedriveLink: "",
    maxGroupSize: 4,
  });

  const formRef = useRef(null);
  const submitRef = useMagnetic(0.15);

  // Stagger form fields on mount
  useEffect(() => {
    if (prefersReducedMotion || !formRef.current || loading) return;

    const fields = formRef.current.querySelectorAll(".form-field");
    if (!fields.length) return;

    const ctx = gsap.context(() => {
      gsap.from(fields, {
        opacity: 0,
        y: 20,
        stagger: 0.06,
        duration: DURATION.FAST,
        delay: 0.15,
        ease: EASE.out,
      });
    }, formRef.current);

    return () => ctx.revert();
  }, [loading]);

  useEffect(() => {
    if (isEdit) {
      adminApi
        .getAssignment(id)
        .then(({ data }) => {
          const a = data.assignment;
          setForm({
            title: a.title,
            description: a.description || "",
            dueDate: a.due_date
              ? new Date(a.due_date).toISOString().slice(0, 16)
              : "",
            onedriveLink: a.onedrive_link,
            maxGroupSize: a.max_group_size,
          });
        })
        .catch(() =>
          setError("Couldn't load assignment. Refresh and try again."),
        )
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (isEdit) {
        await adminApi.updateAssignment(id, form);
      } else {
        await adminApi.createAssignment(form);
      }
      navigate("/admin/assignments");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Couldn't save. Check your entries and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (loading) {
    return (
      <PageShell title="Assignment form">
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={isEdit ? "Edit assignment" : "New assignment"}
      subtitle="Set the brief, due date, and submission folder in one centered flow."
    >
      <div className="mx-auto w-full max-w-3xl" ref={formRef}>
        {error ? (
          <div className="mb-6 px-4 py-3 text-meta bg-semantic-danger/8 text-semantic-danger border border-semantic-danger/15 rounded-xl form-field">
            {error}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 card p-5 sm:p-7 lg:p-8"
          autoComplete="off"
        >
          <div className="form-field">
            <label
              className="block text-meta font-medium text-text-primary mb-2"
              htmlFor="title"
            >
              Assignment title
            </label>
            <input
              id="title"
              name="title"
              className="input-field"
              value={form.title}
              onChange={set("title")}
              required
              placeholder="Assignment title..."
            />
          </div>

          <div className="form-field">
            <label
              className="block text-meta font-medium text-text-primary mb-2"
              htmlFor="description"
            >
              Details
            </label>
            <textarea
              id="description"
              name="description"
              className="input-field min-h-[120px] resize-y"
              value={form.description}
              onChange={set("description")}
              placeholder="Instructions for students..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 form-field">
            <div>
              <label
                className="block text-meta font-medium text-text-primary mb-2"
                htmlFor="dueDate"
              >
                Due date
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="datetime-local"
                className="input-field"
                value={form.dueDate}
                onChange={set("dueDate")}
                required
              />
            </div>
            <div>
              <label
                className="block text-meta font-medium text-text-primary mb-2"
                htmlFor="maxGroupSize"
              >
                Max group size
              </label>
              <input
                id="maxGroupSize"
                name="maxGroupSize"
                type="number"
                className="input-field"
                min="1"
                max="20"
                value={form.maxGroupSize}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    maxGroupSize: parseInt(e.target.value) || 4,
                  }))
                }
              />
            </div>
          </div>

          <div className="form-field">
            <label
              className="block text-meta font-medium text-text-primary mb-2"
              htmlFor="onedriveLink"
            >
              <span className="flex items-center gap-1.5">
                OneDrive submission link
                <ExternalLink
                  size={12}
                  className="text-text-tertiary"
                  aria-hidden="true"
                />
              </span>
            </label>
            <input
              id="onedriveLink"
              name="onedriveLink"
              type="url"
              className="input-field"
              value={form.onedriveLink}
              onChange={set("onedriveLink")}
              required
              placeholder="https://onedrive.live.com/..."
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 form-field">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Back
            </button>
            <button
              ref={submitRef}
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ willChange: saving ? "auto" : "transform" }}
            >
              {saving
                ? "Saving now..."
                : isEdit
                  ? "Update assignment"
                  : "Create assignment"}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
