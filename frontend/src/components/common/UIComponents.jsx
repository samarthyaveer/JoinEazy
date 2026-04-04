import { useRef, useLayoutEffect } from "react";
import Inbox from "lucide-react/dist/esm/icons/inbox";
import { gsap, prefersReducedMotion, DURATION, EASE } from "@/lib/gsapConfig";

const statusConfig = {
  needs_group: { label: "Create group", className: "badge-warning" },
  pending: { label: "Not started", className: "badge-neutral" },
  group_ready: { label: "Team ready", className: "badge-neutral" },
  link_visited: { label: "Link opened", className: "badge-neutral" },
  awaiting_confirmation: { label: "Needs confirm", className: "badge-warning" },
  submitted_waiting: { label: "Waiting on team", className: "badge-warning" },
  submitted: { label: "Uploaded", className: "badge-success" },
  missing_deadline: { label: "Missed setup", className: "badge-danger" },
};

const ragColorMap = {
  green: "bg-semantic-success",
  amber: "bg-semantic-warning",
  red: "bg-semantic-danger",
};

const spinnerSizes = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-8 h-8" };

/**
 * Renders a localized status badge.
 * @param {Object} props
 * @param {string} props.status - The status identifier
 */
export function StatusBadge({ status }) {
  const c = statusConfig[status] || statusConfig.pending;
  return <span className={c.className}>{c.label}</span>;
}

/**
 * Renders a solid color dot for RAG status.
 * @param {Object} props
 * @param {string} props.status - The RAG color id (green, amber, red)
 */
export function RagDot({ status }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${ragColorMap[status] || ragColorMap.red}`}
      title={status}
      aria-hidden="true"
    />
  );
}

/**
 * Progress bar component with GSAP entrance animation.
 * @param {Object} props
 * @param {number} props.value - The current integer value
 * @param {number} [props.max=100] - The maximum integer value
 */
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
        transformOrigin: "left center",
      });
    });

    return () => ctx.revert();
  }, [pct]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className="text-label text-text-tertiary font-mono w-8 text-right"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {pct}%
      </span>
    </div>
  );
}

/**
 * An empty state graphic + message for missing data.
 * @param {Object} props
 * @param {React.ElementType} [props.icon] - Lucide icon component
 * @param {string} props.title - Empty state title
 * @param {string} [props.description] - Empty state description
 * @param {React.ReactNode} [props.action] - Action button or component to display below
 */
export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  const iconRef = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !iconRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(iconRef.current, {
        y: -6,
        duration: 3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-14 sm:py-18 text-center px-4">
      <div
        ref={iconRef}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-surface-overlay flex items-center justify-center mb-4"
        style={{ willChange: "transform" }}
      >
        <Icon
          size={24}
          className="text-text-tertiary"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
      <h3 className="text-lg sm:text-body font-semibold text-text-primary mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm sm:text-meta text-text-secondary max-w-sm mb-5">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

/**
 * Metric card with animated number increment.
 * @param {Object} props
 * @param {string} props.label - Tiny upper-cased top label
 * @param {number|string} props.value - The metric value (can include text)
 * @param {string} [props.sublabel] - Subtext directly underneath metric
 */
export function StatCard({ label, value, sublabel, className = "" }) {
  const valueRef = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !valueRef.current) return;

    const numVal = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numVal)) {
      valueRef.current.textContent = value;
      return;
    }

    const suffix = typeof value === "string" ? value.replace(/[\d.]/g, "") : "";
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
    <div className={`card px-4 sm:px-5 py-4 sm:py-5 group transition-shadow ${className}`.trim()}>
      <p className="text-xs sm:text-label text-text-tertiary uppercase tracking-widest">
        {label}
      </p>
      <p
        ref={valueRef}
        className="text-[1.65rem] sm:text-[2rem] lg:text-[2.25rem] font-bold text-text-primary mt-2 leading-none"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {prefersReducedMotion ? value : 0}
      </p>
      {sublabel && (
        <p className="text-xs sm:text-label text-text-tertiary mt-2">
          {sublabel}
        </p>
      )}
    </div>
  );
}

/**
 * Loading spinner standarding sizing sizes.
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Spinner size
 */
export function Spinner({ size = "md" }) {
  return (
    <div
      className={`${spinnerSizes[size]} border-2 border-accent/20 border-t-accent rounded-full animate-spin`}
      role="status"
      aria-label="Loading…"
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}
