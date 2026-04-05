import { useState, useRef, useLayoutEffect } from "react";
import Sidebar from "./Sidebar";
import { gsap, prefersReducedMotion, DURATION, EASE } from "@/lib/gsapConfig";
import Menu from "lucide-react/dist/esm/icons/menu";
import ThemeToggle from "@/components/common/ThemeToggle";

/**
 * Standard page shell that wraps the application layout.
 * Includes a responsive sidebar, mobile top navigation, and main content area.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Main page content
 * @param {string} props.title - Primary page heading
 * @param {string} [props.subtitle] - Secondary sub-heading
 * @param {React.ReactNode} [props.action] - Right-aligned action button/content in header
 */
export default function PageShell({ title, subtitle, action, children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const orbRef = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Title clip-path reveal
      const heading = headerRef.current?.querySelector("h1");
      if (heading) {
        gsap.from(heading, {
          clipPath: "inset(0 0 100% 0)",
          opacity: 0,
          duration: DURATION.FAST,
          ease: "power3.out",
        });
      }

      // Subtitle fade
      const sub = headerRef.current?.querySelector("p");
      if (sub) {
        gsap.from(sub, {
          opacity: 0,
          y: 8,
          duration: DURATION.FAST,
          delay: 0.1,
          ease: EASE.out,
        });
      }

      // Action button
      const act = headerRef.current?.querySelector("[data-action]");
      if (act) {
        gsap.from(act, {
          opacity: 0,
          scale: 0.95,
          duration: DURATION.FAST,
          delay: 0.1,
          ease: EASE.out,
        });
      }

      // Content stagger
      if (contentRef.current) {
        gsap.from(contentRef.current, {
          opacity: 0,
          y: 12,
          duration: DURATION.FAST,
          delay: 0.05,
          ease: EASE.out,
        });
      }

      // Ambient orb
      if (orbRef.current) {
        gsap.to(orbRef.current, {
          x: 40,
          y: -30,
          duration: 12,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
    });

    return () => ctx.revert();
  }, [title]);

  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="noise-overlay pointer-events-none fixed inset-0 z-0 hidden lg:block" />
      <div
        ref={orbRef}
        className="gradient-orb pointer-events-none absolute hidden lg:block"
        style={{
          width: "560px",
          height: "560px",
          background:
            "radial-gradient(circle, rgb(var(--color-accent) / 0.14) 0%, rgb(var(--color-accent) / 0.06) 40%, transparent 72%)",
          top: "-8%",
          right: "-8%",
          zIndex: 0,
        }}
      />
      <div
        className="gradient-orb pointer-events-none absolute hidden lg:block"
        style={{
          width: "420px",
          height: "420px",
          background:
            "radial-gradient(circle, rgb(var(--color-semantic-success) / 0.12) 0%, rgb(var(--color-semantic-success) / 0.05) 40%, transparent 70%)",
          bottom: "-12%",
          left: "-6%",
          zIndex: 0,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] z-0"
        style={{
          background:
            "linear-gradient(180deg, rgb(var(--color-surface-overlay) / 0.7) 0%, rgb(var(--color-surface) / 0.25) 45%, transparent 100%)",
        }}
      />

      <div className="relative z-10 min-h-screen">
        <header className="lg:hidden flex items-center justify-between h-16 px-4 sm:px-6 bg-surface-overlay/70 backdrop-blur-2xl border-b border-border/60 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <img
              src="/joineazy.png"
              alt="JoinEazy Logo"
              width={24}
              height={24}
            />
            <div>
              <span className="text-body font-bold text-text-primary block leading-none">
                JoinEazy
              </span>
              <span className="text-label text-text-tertiary">Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu size={21} strokeWidth={2} />
            </button>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 lg:pt-10 pb-24 lg:pb-32">
          <div className="max-w-[84rem] 2xl:max-w-[88rem] mx-auto w-full">
            <div ref={headerRef} className="mb-5 sm:mb-7">
              <div className="card p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 text-center lg:text-left">
                  <div className="max-w-3xl">
                    <h1
                      className="text-[1.7rem] sm:text-2xl lg:text-page font-bold text-text-primary"
                      style={{ textWrap: "balance" }}
                    >
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-sm sm:text-body text-text-secondary mt-2">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  {action && (
                    <div
                      data-action
                      className="shrink-0 w-full sm:w-auto mx-auto lg:mx-0"
                    >
                      {action}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div ref={contentRef} className="content-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
