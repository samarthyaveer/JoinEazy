import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap, prefersReducedMotion, DURATION, EASE } from '../lib/gsapConfig';
import { useMagnetic } from '../hooks/useGsap';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // GSAP refs
  const leftPanelRef = useRef(null);
  const formRef = useRef(null);
  const headingRef = useRef(null);
  const subtitleRef = useRef(null);
  const orbRef = useRef(null);
  const submitRef = useMagnetic(0.2);

  // Entrance animation
  useEffect(() => {
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.out } });

      // Left panel — slide in from left
      tl.from(leftPanelRef.current, {
        x: -60,
        opacity: 0,
        duration: DURATION.SLOW,
      });

      // Heading clip-path reveal
      tl.from(headingRef.current, {
        clipPath: 'inset(0 0 100% 0)',
        opacity: 0,
        duration: DURATION.SLOW,
        ease: EASE.expo,
      }, '-=0.6');

      // Subtitle fade
      tl.from(subtitleRef.current, {
        opacity: 0,
        y: 16,
        duration: DURATION.FAST,
      }, '-=0.3');

      // Form fields stagger
      const formFields = formRef.current?.querySelectorAll('.form-field');
      if (formFields?.length) {
        tl.from(formFields, {
          opacity: 0,
          y: 24,
          stagger: 0.08,
          duration: DURATION.FAST,
        }, '-=0.2');
      }

      // Floating orb animation (infinite, transform-only)
      if (orbRef.current) {
        gsap.to(orbRef.current, {
          x: 30,
          y: -20,
          duration: 8,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Check your email and password.');
    } finally {
      setLoading(false);
    }
  }, [form.email, form.password, login, navigate]);

  return (
    <div className="min-h-screen flex bg-surface relative overflow-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Left panel — branding */}
      <div
        ref={leftPanelRef}
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-20 relative overflow-hidden"
      >
        {/* Gradient orbs */}
        <div
          ref={orbRef}
          className="gradient-orb"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(0,85,255,0.08) 0%, transparent 70%)',
            top: '20%',
            left: '10%',
          }}
        />
        <div
          className="gradient-orb"
          style={{
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(0,85,255,0.05) 0%, transparent 70%)',
            bottom: '10%',
            right: '0%',
          }}
        />

        <div className="relative max-w-lg z-10">
          <div className="flex items-center gap-3 mb-16">
            <img src="/joineazy.png" alt="JoinEazy logo" width={40} height={40} className="flex-shrink-0" />
            <span className="text-text-primary font-semibold text-section tracking-tight">JoinEazy</span>
          </div>

          <h2
            ref={headingRef}
            className="text-hero text-text-primary leading-none mb-6"
            style={{ textWrap: 'balance' }}
          >
            Manage assignments,{' '}
            <span className="text-text-secondary">groups & submissions</span>{' '}
            in one place.
          </h2>

          <p
            ref={subtitleRef}
            className="text-body text-text-secondary leading-relaxed max-w-md"
          >
            A collaborative platform for students and professors to streamline
            assignment workflows and submission tracking.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm" ref={formRef}>
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-12">
            <img src="/joineazy.png" alt="JoinEazy logo" width={32} height={32} />
            <span className="font-semibold text-body text-text-primary">JoinEazy</span>
          </div>

          <h1 className="text-page text-text-primary mb-2 form-field">Sign In</h1>
          <p className="text-body text-text-secondary mb-10 form-field">
            Enter your credentials to continue
          </p>

          {error ? (
            <div className="mb-6 px-4 py-3 text-meta bg-semantic-danger/8 text-semantic-danger border border-semantic-danger/15 rounded-xl form-field">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            <div className="form-field">
              <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="form-field">
              <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="input-field"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <div className="form-field pt-1">
              <button
                ref={submitRef}
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
                style={{ willChange: loading ? 'auto' : 'transform' }}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Sign In'}
              </button>
            </div>
          </form>

          <p className="text-body text-text-secondary text-center mt-10 form-field">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent font-medium hover:text-accent-hover transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
