export type VisualFrame = { opacity?: number; x?: number; y?: number; scale?: number; rotate?: number };
export type MotionTiming = { duration: number; easing: string; delay?: number };
export type MotionRequest = { target: HTMLElement; keyframes: VisualFrame[]; timing: MotionTiming };
export type MotionBackend = 'waapi' | 'animejs';

export interface MotionHandle {
  readonly backend: MotionBackend;
  readonly duration: number;
  readonly finished: Promise<'finished' | 'cancelled'>;
  play(): void;
  pause(): void;
  reverse(): void;
  seek(timeMs: number): void;
  cancel(): void;
}

export interface MotionProvider {
  readonly backend: MotionBackend;
  animate(request: MotionRequest): MotionHandle;
  activeCount(): number;
}
