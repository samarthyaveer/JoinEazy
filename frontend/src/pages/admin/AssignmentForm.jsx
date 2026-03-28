import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import PageShell from '../../components/layout/PageShell';
import { Spinner } from '../../components/common/UIComponents';
import { gsap, prefersReducedMotion, DURATION, EASE } from '../../lib/gsapConfig';
import { useMagnetic } from '../../hooks/useGsap';
import api from '../../services/api';

export default function AssignmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    onedriveLink: '',
    maxGroupSize: 4,
  });

  const formRef = useRef(null);
  const submitRef = useMagnetic(0.15);

  // Stagger form fields on mount
  useEffect(() => {
    if (prefersReducedMotion || !formRef.current || loading) return;

    const fields = formRef.current.querySelectorAll('.form-field');
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
      api.get(`/assignments/${id}`).then(({ data }) => {
        const a = data.assignment;
        setForm({
          title: a.title,
          description: a.description || '',
          dueDate: a.due_date ? new Date(a.due_date).toISOString().slice(0, 16) : '',
          onedriveLink: a.onedrive_link,
          maxGroupSize: a.max_group_size,
        });
      }).catch(() => setError('Failed to load assignment. Try refreshing.'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit) {
        await api.put(`/assignments/${id}`, form);
      } else {
        await api.post('/assignments', form);
      }
      navigate('/admin/assignments');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Check your inputs and try again.');
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  if (loading) {
    return <PageShell title="Assignment"><div className="flex justify-center py-20"><Spinner /></div></PageShell>;
  }

  return (
    <PageShell title={isEdit ? 'Edit Assignment' : 'New Assignment'}>
      <div className="max-w-lg" ref={formRef}>
        {error ? (
          <div className="mb-6 px-4 py-3 text-meta bg-semantic-danger/8 text-semantic-danger border border-semantic-danger/15 rounded-xl form-field">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className="form-field">
            <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="title">Title</label>
            <input id="title" name="title" className="input-field" value={form.title} onChange={set('title')} required placeholder="Assignment title…" />
          </div>

          <div className="form-field">
            <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="input-field min-h-[120px] resize-y"
              value={form.description}
              onChange={set('description')}
              placeholder="Instructions and details for students…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 form-field">
            <div>
              <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="dueDate">Due Date</label>
              <input
                id="dueDate"
                name="dueDate"
                type="datetime-local"
                className="input-field"
                value={form.dueDate}
                onChange={set('dueDate')}
                required
              />
            </div>
            <div>
              <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="maxGroupSize">Max Group Size</label>
              <input
                id="maxGroupSize"
                name="maxGroupSize"
                type="number"
                className="input-field"
                min="1"
                max="20"
                value={form.maxGroupSize}
                onChange={(e) => setForm(prev => ({ ...prev, maxGroupSize: parseInt(e.target.value) || 4 }))}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="onedriveLink">
              <span className="flex items-center gap-1.5">
                OneDrive Submission Link
                <ExternalLink size={12} className="text-text-tertiary" aria-hidden="true" />
              </span>
            </label>
            <input
              id="onedriveLink"
              name="onedriveLink"
              type="url"
              className="input-field"
              value={form.onedriveLink}
              onChange={set('onedriveLink')}
              required
              placeholder="https://onedrive.live.com/…"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 form-field">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Cancel
            </button>
            <button ref={submitRef} type="submit" className="btn-primary" disabled={saving} style={{ willChange: saving ? 'auto' : 'transform' }}>
              {saving ? 'Saving…' : isEdit ? 'Update Assignment' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
