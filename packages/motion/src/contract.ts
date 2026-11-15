import type { ManifestVisualField } from './manifest.js';
export type VisualFrame = Partial<Record<ManifestVisualField, number>>;
/** `iterations` defaults to 1; `Infinity` repeats forever. Only the WAAPI provider takes another count than 1. */
export type MotionTiming = { duration: number; easing: string; delay?: number; iterations?: number };
export type MotionRequest = {
  target: HTMLElement;
  keyframes: VisualFrame[];
  timing: MotionTiming;
  /** Default true. `false` removes the animation at its end and writes nothing inline. */
  commit?: boolean;
  /**
   * Extra CSS declarations per keyframe, camelCase, one entry per keyframe: corrections of the layout engine, which only
   * the WAAPI provider supports. They are for corrections that end at rest: a commit does not persist them.
   */
  styles?: ReadonlyArray<Readonly<Record<string, string>>>;
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
  /** Milliseconds before the motion starts; 0 when it has none. `duration` does not include it. */
  readonly delay: number;
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
