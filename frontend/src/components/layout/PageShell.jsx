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
            "radial-gradient(circle, rgb(var(--color-accent) / 0.1) 0%, rgb(var(--color-accent) / 0.04) 38%, transparent 72%)",
          top: "-8%",
          right: "-8%",
          zIndex: 0,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] z-0"
        style={{
          background:
            "linear-gradient(180deg, rgb(var(--color-surface-raised) / 0.9) 0%, rgb(var(--color-surface-raised) / 0.45) 40%, transparent 100%)",
        }}
      />

      <div className="relative z-10 min-h-screen">
        <header className="lg:hidden flex items-center justify-between h-16 px-4 sm:px-6 bg-surface-raised/88 backdrop-blur-xl border-b border-border sticky top-0 z-30">
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

        <main className="px-4 sm:px-5 lg:px-8 pt-5 pb-28 lg:pt-8 lg:pb-36">
          <div className="max-w-[88rem] mx-auto w-full">
            <div
              ref={headerRef}
              className="flex flex-col gap-4 mb-6 sm:mb-8"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="max-w-3xl mx-auto">
                  <h1
                    className="text-[1.85rem] sm:text-3xl lg:text-page font-bold text-text-primary"
                    style={{ textWrap: "balance" }}
                  >
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm sm:text-body text-text-secondary mt-2 max-w-2xl mx-auto">
                      {subtitle}
                    </p>
                  )}
                </div>
                {action && (
                  <div data-action className="shrink-0 w-full sm:w-auto mx-auto">
                    {action}
                  </div>
                )}
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
