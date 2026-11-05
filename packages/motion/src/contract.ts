export type VisualFrame = { opacity?: number; x?: number; y?: number; scale?: number; rotate?: number };
export type MotionTiming = { duration: number; easing: string; delay?: number };
export type MotionRequest = { target: HTMLElement; keyframes: VisualFrame[]; timing: MotionTiming };
export type MotionBackend = 'css' | 'waapi' | 'animejs';
export type Capability =
  | 'compositor' | 'spring-velocity' | 'scroll-timeline' | 'view-transition' | 'layout-flip'
  | 'discrete' | 'text-split' | 'svg-morph' | 'gesture';

export interface MotionHandle {
  readonly backend: MotionBackend;
  readonly duration: number;
  readonly finished: Promise<'finished' | 'cancelled'>;
  /** value is a placeholder when source is unavailable. */
  readonly velocity: { value: number; source: 'exact' | 'estimated' | 'unavailable' };
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
