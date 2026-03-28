import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins once
gsap.registerPlugin(ScrollTrigger);

// Check prefers-reduced-motion
export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Shared duration constants
export const DURATION = {
  FAST:   0.4,
  NORMAL: 0.7,
  SLOW:   1.0,
};

// Shared eases
export const EASE = {
  out:    'power3.out',
  inOut:  'power3.inOut',
  expo:   'expo.out',
  spring: 'elastic.out(1, 0.5)',
  back:   'back.out(1.7)',
};

export { gsap, ScrollTrigger };
