import { useState, useRef, useLayoutEffect } from 'react';
import Sidebar from './Sidebar';
import { gsap, prefersReducedMotion, DURATION, EASE } from '@/lib/gsapConfig';
import Menu from 'lucide-react/dist/esm/icons/menu';

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
      const heading = headerRef.current?.querySelector('h1');
      if (heading) {
        gsap.from(heading, {
          clipPath: 'inset(0 0 100% 0)',
          opacity: 0,
          duration: DURATION.FAST,
          ease: 'power3.out',
        });
      }

      // Subtitle fade
      const sub = headerRef.current?.querySelector('p');
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
      const act = headerRef.current?.querySelector('[data-action]');
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
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }
    });

    return () => ctx.revert();
  }, [title]);

  return (
    <div className="flex bg-surface relative h-screen overflow-hidden">
      {/* Sidebar - Handles its own responsive styling */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        {/* Mobile Top Navbar */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 sm:px-6 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <img src="/joineazy.png" alt="JoinEazy Logo" width={24} height={24} />
            <span className="text-body font-bold text-text-primary">JoinEazy</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -mr-2 text-text-tertiary hover:text-text-primary hover:bg-surface-overlay rounded-xl transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={24} strokeWidth={2} />
          </button>
        </header>

        {/* Ambient visuals */}
        <div className="noise-overlay pointer-events-none fixed inset-0 z-0" />
        <div
          ref={orbRef}
          className="gradient-orb pointer-events-none absolute"
          style={{
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(0,85,255,0.04) 0%, transparent 70%)',
            top: '-10%',
            right: '-5%',
            zIndex: 0
          }}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pt-10 z-10">
          <div className="max-w-7xl mx-auto w-full">
            {/* Page Header */}
            <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 sm:mb-10">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-page font-bold text-text-primary" style={{ textWrap: 'balance' }}>
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm sm:text-body text-text-secondary mt-2 max-w-prose">
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

            {/* Page Content */}
            <div ref={contentRef}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}