export { RUNTIME_KEY } from './runtime-key.js';
export type {
  VisualFrame,
  MotionElement,
  MotionTiming,
  MotionRequest,
  MotionBackend,
  Capability,
  MotionHandle,
  MotionProvider,
} from './contract.js';
export { defineTokens, resolveSpring, resolveCurve, springParams } from './tokens.js';
export type { SpringParams } from './spring.js';
export type { DurationToken, EasingToken, CurveTiming, Timing, ResolvedCurve, MotionScheme, MotionTokens, SpringToken, SpringSupport, ResolvedSpring } from './tokens.js';
export type { Verb, SpringRef, ReducedRender } from './motion-spec.js';
export { defineMotion, defineShared, resolveMotion, onMotionDefined, validateMotionSpec, definedMotions, isPresenceVerb, kindOf } from './define-motion.js';
export type { MotionSpec, MotionRef, MotionKind, MotionName, MotionRegistry } from './define-motion.js';
export { resolveValue, onValueDefined } from './registries.js';
export type { ValueSpec, ValueRef, ValueSource, ValueAxis, ValueFormat, ValueUnit } from './value.js';
export { getMotionRuntime, retainMotionRuntime } from './runtime.js';
export { composeHandles, deferredHandle, settledHandle, splitFrames } from './compose.js';
export { playMotion, playFrames, applyFrame, releaseFrame, resolveWaapiTiming, paintFrame, applyRestingFrame, releaseOwned, restingFields, distanceScaleOf } from './play.js';
export { amplitudeOf } from './amplitude.js';
export { prepareDraw, restoreDraw } from './svg-fields.js';
export { motion, motionWhenDefined, motionsWhenDefined, getMotion, getMotions, playListed, listedTarget } from './bind.js';
export type { BindOptions, DeferredMotion, MotionBinding, MotionSource } from './bind.js';
export type { ValueBinding } from './value-binding.js';
export { watchView, viewedBox } from './viewport.js';
export type { ViewAxis } from './viewport.js';
export { layoutScopeOf } from './scope-of.js';
export { loadLayoutEngine, layoutEngine, flushLayoutAround } from './layout-loader.js';
export { loadValues, valuesModule, loadSequences, sequencesModule, loadGestures, gesturesModule, loadText, textModule, loadContinuous, continuousModule } from './feature-loader.js';
export type { ValueApi, SequenceApi, GestureApi, TextApi, ContinuousApi } from './feature-loader.js';
export { resolveGesture, onGestureDefined } from './registries.js';
export type { GestureSpec, GestureRef, GestureType } from './gesture.js';
export type { GestureBinding } from './gesture-binding.js';
export type { LayoutTracking } from './layout.js';
export { pinOutOfFlow } from './pin.js';
export { staggered, staggerDelay, visualRanks } from './stagger.js';
export type { StaggerOptions } from './stagger.js';
export { resolveSequence, onSequenceDefined } from './registries.js';
export type { SequenceSpec, SequenceStep, SequenceRef, SequenceBinding, SequenceStepRegistry, SequenceStepName } from './sequence.js';
export type { Stretch, AxisProgress, ContentPlan } from './project.js';
export type { Box, OwnTransform } from './flip.js';
export { connectMotion } from './connect.js';
export { setPresentByHidden, releaseHiddenHold } from './hidden-presence.js';
export { isMotionDevelopment } from './development.js';
export type { PresenceTaker } from './hidden-presence.js';
export type { ConnectOptions } from './connect.js';
export type { MotionRuntime } from './runtime.js';
