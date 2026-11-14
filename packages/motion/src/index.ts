export { RUNTIME_KEY } from './runtime-key.js';
export type {
  VisualFrame,
  MotionTiming,
  MotionRequest,
  MotionBackend,
  Capability,
  MotionHandle,
  MotionProvider,
} from './contract.js';
export { defineTokens, resolveSpring, resolveCurve } from './tokens.js';
export type { DurationToken, EasingToken, CurveTiming, ResolvedCurve, MotionScheme, MotionTokens, SpringToken, SpringSupport, ResolvedSpring } from './tokens.js';
export type { Verb, SpringRef, ReducedRender } from './motion-spec.js';
export { defineMotion, resolveMotion, onMotionDefined, validateMotionSpec, definedMotions } from './define-motion.js';
export type { MotionSpec, MotionRef } from './define-motion.js';
export { getMotionRuntime, retainMotionRuntime } from './runtime.js';
export { composeHandles, settledHandle, splitFrames } from './compose.js';
export { playMotion, applyFrame, releaseFrame } from './play.js';
export { motion, getMotion } from './bind.js';
export type { MotionBinding, MotionSource } from './bind.js';
export { connectMotion } from './connect.js';
export type { ConnectOptions } from './connect.js';
export type { MotionRuntime } from './runtime.js';
