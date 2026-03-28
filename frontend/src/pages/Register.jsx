import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap, prefersReducedMotion, DURATION, EASE } from '../lib/gsapConfig';
import { useMagnetic } from '../hooks/useGsap';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // GSAP refs
  const rightPanelRef = useRef(null);
  const formRef = useRef(null);
  const headingRef = useRef(null);
  const subtitleRef = useRef(null);
  const orbRef = useRef(null);
  const submitRef = useMagnetic(0.2);

  // Entrance animation — mirror of Login but from the right
  useEffect(() => {
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.out } });

      // Right branding panel — slide in from right
      if (rightPanelRef.current) {
        tl.from(rightPanelRef.current, {
          x: 60,
          opacity: 0,
          duration: DURATION.SLOW,
        });
      }

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
          stagger: 0.06,
          duration: DURATION.FAST,
        }, '-=0.2');
      }

      // Floating orb
      if (orbRef.current) {
        gsap.to(orbRef.current, {
          x: -25,
          y: 20,
          duration: 9,
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

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
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
      setError(err.response?.data?.error || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  }, [form, registerUser, navigate]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  // Role toggle animation
  const roleIndicatorRef = useRef(null);
  const handleRoleChange = useCallback((role) => {
    setForm(prev => ({ ...prev, role }));
    if (!prefersReducedMotion && roleIndicatorRef.current) {
      gsap.to(roleIndicatorRef.current, {
        x: role === 'student' ? 0 : '100%',
        duration: 0.35,
        ease: EASE.back,
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-surface relative overflow-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Left panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm" ref={formRef}>
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-12">
            <img src="/joineazy.png" alt="JoinEazy logo" width={32} height={32} />
            <span className="font-semibold text-body text-text-primary">JoinEazy</span>
          </div>

          <h1 className="text-page text-text-primary mb-2 form-field" ref={headingRef}>Create Account</h1>
          <p className="text-body text-text-secondary mb-10 form-field" ref={subtitleRef}>
            Register as a student or professor
          </p>

          {error ? (
            <div className="mb-6 px-4 py-3 text-meta bg-semantic-danger/8 text-semantic-danger border border-semantic-danger/15 rounded-xl form-field">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            {/* Role selector — animated toggle */}
            <div className="form-field">
              <label className="block text-meta font-medium text-text-primary mb-2">I am a</label>
              <div className="relative grid grid-cols-2 gap-0 rounded-xl border border-border-strong overflow-hidden" style={{ height: '44px' }}>
                {/* Animated sliding indicator */}
                <div
                  ref={roleIndicatorRef}
                  className="absolute inset-y-0 left-0 w-1/2 rounded-xl"
                  style={{
                    background: '#0F0F0F',
                    transform: form.role === 'student' ? 'translateX(0)' : 'translateX(100%)',
                    transition: prefersReducedMotion ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: 0,
                  }}
                />
                {['student', 'admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`relative z-10 text-meta font-medium transition-colors duration-200 ${
                      form.role === role
                        ? 'text-white'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {role === 'student' ? 'Student' : 'Professor'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-field">
              <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                className="input-field"
                placeholder="John Doe"
                value={form.fullName}
                onChange={set('fullName')}
                required
              />
            </div>

            <div className="form-field">
              <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>

            <div className="form-field">
              <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="input-field"
                placeholder="Min 6 characters…"
                value={form.password}
                onChange={set('password')}
                required
              />
            </div>

            <div className="form-field">
              <label className="block text-meta font-medium text-text-primary mb-2" htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="input-field"
                placeholder="Re-enter your password…"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
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
                ) : 'Create Account'}
              </button>
            </div>
          </form>

          <p className="text-body text-text-secondary text-center mt-10 form-field">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-medium hover:text-accent-hover transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — branding (mirrored from Login) */}
      <div
        ref={rightPanelRef}
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
            top: '30%',
            right: '10%',
          }}
        />
        <div
          className="gradient-orb"
          style={{
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(0,85,255,0.05) 0%, transparent 70%)',
            bottom: '15%',
            left: '5%',
          }}
        />

        <div className="relative max-w-lg z-10">
          <div className="flex items-center gap-3 mb-16">
            <img src="/joineazy.png" alt="JoinEazy logo" width={40} height={40} className="flex-shrink-0" />
            <span className="text-text-primary font-semibold text-section tracking-tight">JoinEazy</span>
          </div>

          <h2 className="text-hero text-text-primary leading-none mb-6" style={{ textWrap: 'balance' }}>
            Join as a{' '}
            <span className="text-text-secondary">student or professor.</span>
          </h2>

          <p className="text-body text-text-secondary leading-relaxed max-w-md">
            Create your account to start managing group assignments,
            track submissions, and collaborate with your class.
          </p>
        </div>
      </div>
    </div>
  );
}
