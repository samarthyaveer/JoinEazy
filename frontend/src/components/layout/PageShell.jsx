import { useRef, useLayoutEffect } from 'react';
import BottomDock from './Sidebar';
import { gsap, prefersReducedMotion, DURATION, EASE } from '../../lib/gsapConfig';

export default function PageShell({ title, subtitle, action, children }) {
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
    <div className="min-h-screen bg-surface relative">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Ambient gradient orb */}
      <div
        ref={orbRef}
        className="gradient-orb"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(0,85,255,0.04) 0%, transparent 70%)',
          top: '-10%',
          right: '-5%',
        }}
      />

      <BottomDock />

      <main className="max-w-page mx-auto px-6 lg:px-8 pt-10 pb-32 relative z-10">
        {/* Page header */}
        <div ref={headerRef} className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-page text-text-primary" style={{ textWrap: 'balance' }}>{title}</h1>
            {subtitle ? (
              <p className="text-body text-text-secondary mt-2">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div data-action>{action}</div> : null}
        </div>

        {/* Page content */}
        <div ref={contentRef}>
          {children}
        </div>
      </main>
    </div>
  );
}
