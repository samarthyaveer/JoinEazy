import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import { Spinner } from '../../components/common/UIComponents';
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
    targetType: 'all',
    maxGroupSize: 4,
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/assignments/${id}`).then(({ data }) => {
        const a = data.assignment;
        setForm({
          title: a.title,
          description: a.description || '',
          dueDate: a.due_date ? new Date(a.due_date).toISOString().slice(0, 16) : '',
          onedriveLink: a.onedrive_link,
          targetType: a.target_type,
          maxGroupSize: a.max_group_size,
        });
      }).catch(() => setError('Failed to load assignment'))
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
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  if (loading) {
    return <PageShell title="Assignment"><div className="flex justify-center py-20"><Spinner /></div></PageShell>;
  }

  return (
    <PageShell title={isEdit ? 'Edit Assignment' : 'New Assignment'}>
      <div className="max-w-xl">
        {error && (
          <div className="mb-4 px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input className="input-field" value={form.title} onChange={set('title')} required placeholder="Assignment title" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              className="input-field min-h-[100px] resize-y"
              value={form.description}
              onChange={set('description')}
              placeholder="Instructions and details for students..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Due date</label>
              <input
                type="datetime-local"
                className="input-field"
                value={form.dueDate}
                onChange={set('dueDate')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Max group size</label>
              <input
                type="number"
                className="input-field"
                min="1"
                max="20"
                value={form.maxGroupSize}
                onChange={(e) => setForm({ ...form, maxGroupSize: parseInt(e.target.value) || 4 })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">OneDrive submission link</label>
            <input
              type="url"
              className="input-field"
              value={form.onedriveLink}
              onChange={set('onedriveLink')}
              required
              placeholder="https://onedrive.live.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Target</label>
            <div className="grid grid-cols-2 gap-2">
              {['all', 'specific'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, targetType: type })}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    form.targetType === type
                      ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                      : 'border-border text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {type === 'all' ? 'All Students' : 'Specific Groups'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Assignment' : 'Create Assignment'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
