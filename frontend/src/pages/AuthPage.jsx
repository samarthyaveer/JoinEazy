import { useState, useRef, useLayoutEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { gsap, prefersReducedMotion, DURATION, EASE } from "@/lib/gsapConfig";
import { useMagnetic } from "@/hooks/useGsap";

export default function AuthPage() {
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(
    searchParams.get("mode") === "register",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  // Register form
  const [regForm, setRegForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  // GSAP refs
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const brandingRef = useRef(null);
  const loginFormRef = useRef(null);
  const registerFormRef = useRef(null);
  const orbRef = useRef(null);
  const submitRef = useMagnetic(0.2);

  // Animate the sliding panel
  const animateSlide = useCallback((toRegister) => {
    if (prefersReducedMotion) return;

    const tl = gsap.timeline({
      defaults: { ease: EASE.out, duration: DURATION.NORMAL },
    });

    // Overlay slides from one side to the other
    tl.to(overlayRef.current, {
      xPercent: toRegister ? -100 : 0,
      duration: 0.8,
      ease: "power4.inOut",
    });

    // Branding text fades and repositions
    tl.fromTo(
      brandingRef.current,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: DURATION.FAST,
      },
      "-=0.3",
    );

    // Stagger form fields of the newly visible form
    const activeForm = toRegister
      ? registerFormRef.current
      : loginFormRef.current;
    if (activeForm) {
      const fields = activeForm.querySelectorAll(".form-field");
      tl.fromTo(
        fields,
        {
          opacity: 0,
          y: 16,
        },
        {
          opacity: 1,
          y: 0,
          stagger: 0.05,
          duration: 0.3,
        },
        "-=0.2",
      );
    }
  }, []);

  // Initial entrance animation
  useLayoutEffect(() => {
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Set initial state to prevent React inline style fight
      if (overlayRef.current) {
        gsap.set(overlayRef.current, { xPercent: isRegister ? -100 : 0 });
      }

      const tl = gsap.timeline({ defaults: { ease: EASE.out } });

      // Container scale in
      tl.from(containerRef.current, {
        scale: 0.97,
        opacity: 0,
        duration: DURATION.NORMAL,
      });

      // Branding reveal
      if (brandingRef.current) {
        tl.from(
          brandingRef.current.querySelectorAll(".brand-element"),
          {
            opacity: 0,
            y: 30,
            stagger: 0.1,
            duration: DURATION.FAST,
          },
          "-=0.3",
        );
      }

      // Form fields stagger
      const activeForm = isRegister
        ? registerFormRef.current
        : loginFormRef.current;
      if (activeForm) {
        tl.from(
          activeForm.querySelectorAll(".form-field"),
          {
            opacity: 0,
            y: 20,
            stagger: 0.06,
            duration: DURATION.FAST,
          },
          "-=0.2",
        );
      }

      // Floating orb
      if (orbRef.current) {
        gsap.to(orbRef.current, {
          x: 30,
          y: -25,
          duration: 8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const toggleMode = useCallback(() => {
    setError("");
    const next = !isRegister;
    setIsRegister(next);
    setSearchParams(next ? { mode: "register" } : {});
    animateSlide(next);
  }, [isRegister, setSearchParams, animateSlide]);

  // Login
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
        const user = await login(loginForm.email, loginForm.password);
        navigate(user.role === "admin" ? "/admin" : "/dashboard");
      } catch (err) {
        setError(err.message || "Wrong email or password. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [loginForm, login, navigate],
  );

  // Register
  const handleRegister = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      if (regForm.password !== regForm.confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
      if (regForm.password.length < 6) {
        setError("Use 6+ characters.");
        return;
      }
      setLoading(true);
      try {
        const user = await registerUser({
          fullName: regForm.fullName,
          email: regForm.email,
          password: regForm.password,
          role: regForm.role,
        });
        navigate(user.role === "admin" ? "/admin" : "/dashboard");
      } catch (err) {
        setError(err.message || "Couldn't create account. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [regForm, registerUser, navigate],
  );

  // Role toggle
  const roleIndicatorRef = useRef(null);
  const handleRoleChange = useCallback((role) => {
    setRegForm((prev) => ({ ...prev, role }));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface relative overflow-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Background orbs */}
      <div
        ref={orbRef}
        className="gradient-orb"
        style={{
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(0,85,255,0.06) 0%, transparent 70%)",
          top: "10%",
          left: "5%",
        }}
      />
      <div
        className="gradient-orb"
        style={{
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(0,85,255,0.04) 0%, transparent 70%)",
          bottom: "10%",
          right: "5%",
        }}
      />

      {/* Main auth container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-md lg:max-w-[920px] lg:min-h-[580px] rounded-2xl lg:rounded-3xl overflow-hidden shadow-modal"
        style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        {/* Two form panels side by side on desktop, stacked/hidden on mobile */}
        <div className="flex flex-col lg:flex-row lg:min-h-[580px]">
          {/* LEFT: Sign In Form */}
          <div
            className={`w-full lg:w-1/2 items-center justify-center p-6 sm:p-10 lg:p-14 transition-opacity duration-400 ${isRegister ? "hidden lg:flex lg:opacity-40 lg:pointer-events-none" : "flex opacity-100 pointer-events-auto"}`}
          >
            <div ref={loginFormRef} className="w-full max-w-sm mx-auto">
              <h2 className="text-page text-text-primary mb-2 form-field">
                Sign in
              </h2>
              <p className="text-body text-text-secondary mb-8 form-field">
                Welcome back.
              </p>

              {!isRegister && error ? (
                <div className="mb-5 px-4 py-3 text-meta bg-semantic-danger/8 text-semantic-danger border border-semantic-danger/15 rounded-xl form-field">
                  {error}
                </div>
              ) : null}

              <form
                onSubmit={handleLogin}
                className="space-y-4"
                autoComplete="on"
              >
                <div className="form-field">
                  <label
                    className="block text-meta font-medium text-text-primary mb-1.5"
                    htmlFor="login-email"
                  >
                    Email address
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    className="input-field"
                    placeholder="name@example.com"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm((p) => ({
                        ...p,
                        email: e.target.value.toLowerCase(),
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label
                    className="block text-meta font-medium text-text-primary mb-1.5"
                    htmlFor="login-password"
                  >
                    Account password
                  </label>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className="input-field"
                    placeholder="********"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((p) => ({ ...p, password: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field pt-1">
                  <button
                    ref={!isRegister ? submitRef : undefined}
                    type="submit"
                    className="btn-primary w-full"
                    disabled={loading}
                    style={{ willChange: loading ? "auto" : "transform" }}
                  >
                    {loading && !isRegister ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </div>
              </form>

              <p className="lg:hidden text-meta text-text-secondary text-center mt-8 form-field">
                Need an account?{" "}
                <button
                  onClick={toggleMode}
                  type="button"
                  className="text-accent font-medium hover:text-accent-hover transition-colors"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>

          {/* RIGHT: Register Form */}
          <div
            className={`w-full lg:w-1/2 items-center justify-center p-6 sm:p-10 lg:p-14 transition-opacity duration-400 ${!isRegister ? "hidden lg:flex lg:opacity-40 lg:pointer-events-none" : "flex opacity-100 pointer-events-auto"}`}
          >
            <div ref={registerFormRef} className="w-full max-w-sm mx-auto">
              <h2 className="text-page text-text-primary mb-2 form-field">
                Create account
              </h2>
              <p className="text-body text-text-secondary mb-8 form-field">
                Choose a role
              </p>

              {isRegister && error ? (
                <div className="mb-5 px-4 py-3 text-meta bg-semantic-danger/8 text-semantic-danger border border-semantic-danger/15 rounded-xl form-field">
                  {error}
                </div>
              ) : null}

              <form
                onSubmit={handleRegister}
                className="space-y-3.5"
                autoComplete="on"
              >
                {/* Role toggle */}
                <div className="form-field">
                  <label className="block text-meta font-medium text-text-primary mb-1.5">
                    I'm a
                  </label>
                  <div
                    className="relative grid grid-cols-2 rounded-xl border border-border-strong overflow-hidden"
                    style={{ height: "40px" }}
                  >
                    <div
                      ref={roleIndicatorRef}
                      className="absolute inset-y-0 left-0 w-1/2 rounded-xl"
                      style={{
                        background: "#0F0F0F",
                        transform:
                          regForm.role === "student"
                            ? "translateX(0)"
                            : "translateX(100%)",
                        transition: prefersReducedMotion
                          ? "none"
                          : "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                      }}
                    />
                    {["student", "admin"].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleChange(role)}
                        className={`relative z-10 text-meta font-medium transition-colors duration-200 ${regForm.role === role ? "text-white" : "text-text-secondary hover:text-text-primary"}`}
                      >
                        {role === "student" ? "Student" : "Instructor"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-field">
                  <label
                    className="block text-meta font-medium text-text-primary mb-1.5"
                    htmlFor="reg-name"
                  >
                    Full name
                  </label>
                  <input
                    id="reg-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    className="input-field"
                    placeholder="e.g. John Doe"
                    value={regForm.fullName}
                    onChange={(e) =>
                      setRegForm((p) => ({ ...p, fullName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label
                    className="block text-meta font-medium text-text-primary mb-1.5"
                    htmlFor="reg-email"
                  >
                    Email address
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    className="input-field"
                    placeholder="name@example.com"
                    value={regForm.email}
                    onChange={(e) =>
                      setRegForm((p) => ({
                        ...p,
                        email: e.target.value.toLowerCase(),
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label
                    className="block text-meta font-medium text-text-primary mb-1.5"
                    htmlFor="reg-password"
                  >
                    Create password
                  </label>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    className="input-field"
                    placeholder="6+ characters"
                    value={regForm.password}
                    onChange={(e) =>
                      setRegForm((p) => ({ ...p, password: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label
                    className="block text-meta font-medium text-text-primary mb-1.5"
                    htmlFor="reg-confirm"
                  >
                    Confirm password
                  </label>
                  <input
                    id="reg-confirm"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="input-field"
                    placeholder="Repeat password"
                    value={regForm.confirmPassword}
                    onChange={(e) =>
                      setRegForm((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-field pt-1">
                  <button
                    ref={isRegister ? submitRef : undefined}
                    type="submit"
                    className="btn-primary w-full"
                    disabled={loading}
                    style={{ willChange: loading ? "auto" : "transform" }}
                  >
                    {loading && isRegister ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Create account"
                    )}
                  </button>
                </div>
              </form>

              <p className="lg:hidden text-meta text-text-secondary text-center mt-6 form-field">
                Have an account?{" "}
                <button
                  onClick={toggleMode}
                  type="button"
                  className="text-accent font-medium hover:text-accent-hover transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* GSAP Sliding Overlay Panel — the branding panel that slides (Desktop Only) */}
        <div
          ref={overlayRef}
          className="hidden lg:flex absolute inset-y-0 right-0 w-1/2 items-center justify-center p-12 z-20"
          style={{
            background: "#0F0F0F",
            transform: prefersReducedMotion
              ? isRegister
                ? "translateX(-100%)"
                : "translateX(0%)"
              : undefined,
            transition: prefersReducedMotion ? "none" : undefined,
            willChange: "transform",
          }}
        >
          <div ref={brandingRef} className="text-center max-w-sm">
            <div className="brand-element flex items-center justify-center gap-2.5 mb-10">
              <img
                src="/joineazy.png"
                alt="JoinEazy"
                width={36}
                height={36}
                className="flex-shrink-0"
              />
              <span className="text-white font-semibold text-section tracking-tight">
                JoinEazy
              </span>
            </div>

            <h3
              className="brand-element text-[32px] font-bold text-white leading-tight mb-4"
              style={{ letterSpacing: "-0.03em", textWrap: "balance" }}
            >
              {isRegister ? (
                <>
                  Sign in.
                  <br />
                  <span className="text-white/50">Back to your account.</span>
                </>
              ) : (
                <>
                  Create account.
                  <br />
                  <span className="text-white/50">Student or instructor.</span>
                </>
              )}
            </h3>

            <p className="brand-element text-meta text-white/40 mb-8">
              {isRegister
                ? "Use your email and password."
                : "Pick a role to start."}
            </p>

            <button
              onClick={toggleMode}
              className="brand-element inline-flex items-center justify-center h-11 px-8 rounded-xl text-meta font-medium text-white border border-white/20 hover:bg-white/10 transition-colors"
              style={{ willChange: "transform" }}
            >
              {isRegister ? "Sign in" : "Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
