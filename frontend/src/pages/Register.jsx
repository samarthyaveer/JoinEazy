import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const user = await registerUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">JE</span>
            </div>
            <span className="text-white font-semibold text-lg">JoinEazy</span>
          </div>
          <h2 className="text-3xl font-semibold text-white leading-tight mb-3">
            Join as a student<br />or professor.
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Create your account to start managing group assignments,
            track submissions, and collaborate with your class.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-md bg-brand-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">JE</span>
            </div>
            <span className="font-semibold">JoinEazy</span>
          </div>

          <h1 className="text-xl font-semibold mb-1">Create account</h1>
          <p className="text-sm text-text-secondary mb-6">
            Register as a student or professor to get started
          </p>

          {error && (
            <div className="mb-4 px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium mb-1.5">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {['student', 'admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm({ ...form, role })}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      form.role === role
                        ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                        : 'border-border text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    {role === 'student' ? 'Student' : 'Professor'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={form.fullName}
                onChange={set('fullName')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                className="input-field"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={set('password')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-text-secondary text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
