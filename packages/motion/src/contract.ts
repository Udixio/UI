import type { ManifestVisualField } from './manifest.js';
export type VisualFrame = Partial<Record<ManifestVisualField, number>>;
export type MotionTiming = { duration: number; easing: string; delay?: number };
export type MotionRequest = {
  target: HTMLElement;
  keyframes: VisualFrame[];
  timing: MotionTiming;
  /** Default true. `false` removes the animation at its end and writes nothing inline. */
  commit?: boolean;
};
export type MotionBackend = 'css' | 'waapi' | 'animejs';
export type Capability =
  | 'compositor'
  | 'spring-velocity'
  | 'scroll-timeline'
  | 'view-transition'
  | 'layout-flip'
  | 'discrete'
  | 'text-split'
  | 'svg-morph'
  | 'gesture';

export interface MotionHandle {
  readonly backend: MotionBackend;
  readonly duration: number;
  /** Milliseconds elapsed in the animation, delay included; frozen once settled. */
  readonly currentTime: number;
  readonly finished: Promise<'finished' | 'cancelled'>;
  /** value is a placeholder when source is unavailable. */
  readonly velocity: {
    value: number;
    source: 'exact' | 'estimated' | 'unavailable';
  };
  play(): void;
  pause(): void;
  reverse(): void;
  seek(timeMs: number): void;
  cancel(): void;
}

export interface MotionProvider {
  readonly backend: MotionBackend;
  readonly capabilities: ReadonlySet<Capability>;
  animate(request: MotionRequest): MotionHandle;
  activeCount(): number;
}
