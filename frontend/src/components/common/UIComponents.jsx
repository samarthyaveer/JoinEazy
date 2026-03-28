import { useRef, useLayoutEffect } from 'react';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import { gsap, prefersReducedMotion, DURATION, EASE } from '../../lib/gsapConfig';

const statusConfig = {
  pending:               { label: 'Pending',      className: 'badge-neutral' },
  link_visited:          { label: 'Visited',       className: 'badge-neutral' },
  awaiting_confirmation: { label: 'Awaiting',      className: 'badge-warning' },
  submitted:             { label: 'Submitted',     className: 'badge-success' },
};

const ragColorMap = {
  green: 'bg-semantic-success',
  amber: 'bg-semantic-warning',
  red:   'bg-semantic-danger',
};

const spinnerSizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };

export function StatusBadge({ status }) {
  const c = statusConfig[status] || statusConfig.pending;
  return <span className={c.className}>{c.label}</span>;
}

export function RagDot({ status }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${ragColorMap[status] || ragColorMap.red}`}
      title={status}
      aria-hidden="true"
    />
  );
}

export function ProgressBar({ value, max = 100 }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const barRef = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !barRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(barRef.current, {
        scaleX: 0,
        duration: DURATION.SLOW,
        delay: 0.3,
        ease: EASE.out,
        transformOrigin: 'left center',
      });
    });

    return () => ctx.revert();
  }, [pct]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full bg-accent rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-label text-text-tertiary font-mono w-8 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  const iconRef = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !iconRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(iconRef.current, {
        y: -6,
        duration: 3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        ref={iconRef}
        className="w-14 h-14 rounded-2xl bg-surface-overlay flex items-center justify-center mb-5"
        style={{ willChange: 'transform' }}
      >
        <Icon size={24} className="text-text-tertiary" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h3 className="text-body font-semibold text-text-primary mb-1">{title}</h3>
      {description ? (
        <p className="text-meta text-text-secondary max-w-xs mb-6">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function StatCard({ label, value, sublabel }) {
  const valueRef = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !valueRef.current) return;

    const numVal = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numVal)) {
      valueRef.current.textContent = value;
      return;
    }

    const suffix = typeof value === 'string' ? value.replace(/[\d.]/g, '') : '';
    const obj = { val: 0 };

    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: numVal,
        duration: DURATION.SLOW,
        delay: 0.2,
        ease: EASE.out,
        onUpdate() {
          valueRef.current.textContent = Math.round(obj.val) + suffix;
        },
      });
    });

    return () => ctx.revert();
  }, [value]);

  return (
    <div className="card px-6 py-6 group hover:shadow-card-hover">
      <p className="text-label text-text-tertiary uppercase tracking-widest">{label}</p>
      <p
        ref={valueRef}
        className="text-[36px] font-bold text-text-primary mt-2 leading-none"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {prefersReducedMotion ? value : 0}
      </p>
      {sublabel ? <p className="text-label text-text-tertiary mt-2">{sublabel}</p> : null}
    </div>
  );
}

export function Spinner({ size = 'md' }) {
  return (
    <div className={`${spinnerSizes[size]} border-2 border-accent/20 border-t-accent rounded-full animate-spin`} role="status" aria-label="Loading…">
      <span className="sr-only">Loading…</span>
    </div>
  );
}
