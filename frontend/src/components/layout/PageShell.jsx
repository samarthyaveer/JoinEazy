import { useState, useRef, useLayoutEffect } from "react";
import Sidebar from "./Sidebar";
import { gsap, prefersReducedMotion, DURATION, EASE } from "@/lib/gsapConfig";
import Menu from "lucide-react/dist/esm/icons/menu";

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
            "radial-gradient(circle, rgba(0,85,255,0.08) 0%, rgba(0,85,255,0.03) 38%, transparent 72%)",
          top: "-8%",
          right: "-8%",
          zIndex: 0,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0) 100%)",
        }}
      />

      <div className="relative z-10 min-h-screen">
        <header className="lg:hidden flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 backdrop-blur-md border-b border-black/6 sticky top-0 z-30">
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
              <span className="text-label text-text-tertiary">Navigation</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -mr-2 text-text-tertiary hover:text-text-primary hover:bg-surface-overlay rounded-xl transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={24} strokeWidth={2} />
          </button>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:pt-8 lg:pb-36">
          <div className="max-w-[92rem] mx-auto w-full">
            <div
              ref={headerRef}
              className="flex flex-col gap-5 mb-8 sm:mb-10"
            >
              <div className="hidden lg:flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-black/6 bg-white/80 px-3 py-2 text-label text-text-tertiary backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  Workspace ready
                </div>
                <div className="text-label text-text-tertiary">
                  Smooth mode for desktop and mobile
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-surface-overlay/80 px-3 py-1.5 text-label text-text-tertiary mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Current workspace
                  </div>
                  <h1
                    className="text-2xl sm:text-3xl lg:text-page font-bold text-text-primary"
                    style={{ textWrap: "balance" }}
                  >
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm sm:text-body text-text-secondary mt-2 max-w-2xl">
                      {subtitle}
                    </p>
                  )}
                </div>
                {action && (
                  <div data-action className="shrink-0 w-full sm:w-auto">
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
