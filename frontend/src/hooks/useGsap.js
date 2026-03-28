import { useLayoutEffect, useRef, useCallback } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion, DURATION, EASE } from '../lib/gsapConfig';

/**
 * useReveal — Fade + slide-up on scroll (or on mount).
 * Following GSAP perf skill: only animates transform (y) + opacity.
 */
export function useReveal(options = {}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !ref.current) return;

    const { delay = 0, duration = DURATION.FAST, y = 20, scroll = false } = options;
    const el = ref.current;

    const config = {
      opacity: 0,
      y,
      duration,
      delay,
      ease: EASE.out,
      clearProps: 'transform',
    };

    let ctx;
    if (scroll) {
      ctx = gsap.context(() => {
        gsap.from(el, {
          ...config,
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true,
          },
        });
      }, el);
    } else {
      ctx = gsap.context(() => {
        gsap.from(el, config);
      }, el);
    }

    return () => ctx.revert();
  }, [options.delay, options.duration, options.y, options.scroll]);

  return ref;
}

/**
 * useStagger — Stagger-reveal children of a container.
 * Per GSAP perf skill: uses stagger instead of many separate tweens.
 */
export function useStagger(options = {}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !ref.current) return;

    const {
      selector = ':scope > *',
      stagger = 0.04,
      duration = DURATION.FAST,
      y = 12,
      delay = 0,
      scroll = false,
    } = options;

    const children = ref.current.querySelectorAll(selector);
    if (!children.length) return;

    const config = {
      opacity: 0,
      y,
      duration,
      stagger,
      delay,
      ease: EASE.out,
      clearProps: 'transform',
    };

    let ctx;
    if (scroll) {
      ctx = gsap.context(() => {
        gsap.from(children, {
          ...config,
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 85%',
            once: true,
          },
        });
      }, ref.current);
    } else {
      ctx = gsap.context(() => {
        gsap.from(children, config);
      }, ref.current);
    }

    return () => ctx.revert();
  }, [options.selector, options.stagger, options.duration, options.y, options.delay, options.scroll]);

  return ref;
}

/**
 * useCountUp — Animate a number from 0 to target.
 * Uses GSAP with a proxy object; no layout-triggering properties.
 */
export function useCountUp(target, options = {}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !ref.current || target === undefined) return;

    const { duration = DURATION.SLOW, delay = 0.2, suffix = '' } = options;
    const el = ref.current;
    const obj = { val: 0 };

    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: typeof target === 'string' ? parseFloat(target) || 0 : target,
        duration,
        delay,
        ease: EASE.out,
        onUpdate() {
          el.textContent = Math.round(obj.val) + suffix;
        },
      });
    });

    return () => ctx.revert();
  }, [target, options.duration, options.delay, options.suffix]);

  return ref;
}

/**
 * useMagnetic — Magnetic hover effect using gsap.quickTo.
 * Per GSAP perf skill: quickTo reuses a single tween for frequent updates.
 */
export function useMagnetic(strength = 0.3) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !ref.current) return;

    const el = ref.current;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      xTo((e.clientX - cx) * strength);
      yTo((e.clientY - cy) * strength);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [strength]);

  return ref;
}

/**
 * useSlideIn — Slide from left or right.
 * Only uses transform (x) + opacity per GSAP perf skill.
 */
export function useSlideIn(direction = 'left', options = {}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !ref.current) return;

    const { duration = DURATION.NORMAL, delay = 0, distance = 60 } = options;
    const x = direction === 'left' ? -distance : distance;

    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0,
        x,
        duration,
        delay,
        ease: EASE.out,
        clearProps: 'transform',
      });
    }, ref.current);

    return () => ctx.revert();
  }, [direction, options.duration, options.delay, options.distance]);

  return ref;
}

/**
 * useClipReveal — Text clip-path reveal animation.
 * Only uses opacity + clipPath for smooth compositor animation.
 */
export function useClipReveal(options = {}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !ref.current) return;

    const { duration = DURATION.SLOW, delay = 0 } = options;

    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        clipPath: 'inset(0 0 100% 0)',
        opacity: 0,
        duration,
        delay,
        ease: EASE.expo,
      });
    }, ref.current);

    return () => ctx.revert();
  }, [options.duration, options.delay]);

  return ref;
}
