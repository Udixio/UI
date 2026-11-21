import type { ManifestVisualField } from './manifest.js';
export type VisualFrame = Partial<Record<ManifestVisualField, number>>;
/** An element a motion moves: an HTML element, or an SVG element (a shape can draw its stroke, a path can morph). */
export type MotionElement = HTMLElement | SVGElement;
/** `iterations` defaults to 1; `Infinity` repeats forever. Only the WAAPI provider takes another count than 1. */
export type MotionTiming = { duration: number; easing: string; delay?: number; iterations?: number };
export type MotionRequest = {
  target: MotionElement;
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

/** A motion that plays: it can be paused, reversed, sought and cancelled, and it says when it ends. */
export interface MotionHandle {
  /** The provider that plays it: `waapi` (the Web Animations API), `animejs` or `css`. */
  readonly backend: MotionBackend;
  /** Milliseconds before the motion starts; 0 when it has none. `duration` does not include it. */
  readonly delay: number;
  /** Milliseconds the motion lasts, without its delay. */
  readonly duration: number;
  /** Milliseconds elapsed in the animation, delay included; frozen once settled. */
  readonly currentTime: number;
  /** Resolves to `'finished'` when the motion ends, or `'cancelled'`; never rejects. */
  readonly finished: Promise<'finished' | 'cancelled'>;
  /** value is a placeholder when source is unavailable. */
  readonly velocity: {
    value: number;
    source: 'exact' | 'estimated' | 'unavailable';
  };
  /** Resume a paused motion. */
  play(): void;
  /** Hold the motion where it is. */
  pause(): void;
  /** Play the motion backwards from where it is. */
  reverse(): void;
  /** Move to `timeMs` milliseconds, delay included. */
  seek(timeMs: number): void;
  /** Stop the motion where it is; `finished` resolves to `'cancelled'`. */
  cancel(): void;
}

export interface MotionProvider {
  readonly backend: MotionBackend;
  readonly capabilities: ReadonlySet<Capability>;
  animate(request: MotionRequest): MotionHandle;
  activeCount(): number;
}
