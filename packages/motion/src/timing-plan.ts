import type { MotionElement } from './contract.js';
import {
  channelsOf,
  SPATIAL_PROPERTIES,
  type Channel,
  type StyleKeyframe,
} from './keyframes.js';
import type { SpringRef } from './motion-spec.js';
import {
  routeTimingWithEvaluator,
  type TimingSupport,
} from './timing-routing.js';
import type { CurveTiming, MotionScheme } from './tokens.js';
import { probeWaapiEasing } from './waapi-probe.js';

/** The speed a motion plays at: an event takes the default springs, a state the fast ones, a driver none (the model, §3.2). */
export type Contract = 'event' | 'state' | 'driver';

/** Properties that play on one timing: the channels it animates and the timing they share. */
export interface TimingGroup {
  readonly channels: ReadonlySet<Channel>;
  readonly timing: SpringRef | CurveTiming;
}

/** The groups of a play, its delay already multiplied by the scale, and the scale it was planned at. */
export interface TimingPlan {
  readonly groups: readonly TimingGroup[];
  readonly delay: number;
  readonly scale: number;
}

/** The springs of an event and of a state: spatial properties take the first, the others the second. */
const SPRINGS: Record<
  'event' | 'state',
  { spatial: SpringRef; effects: SpringRef }
> = {
  event: {
    spatial: 'spring.default.spatial',
    effects: 'spring.default.effects',
  },
  state: { spatial: 'spring.fast.spatial', effects: 'spring.fast.effects' },
};

/** The spring of every property of an exit, so that nothing overshoots while it leaves. */
export const EXIT_SPRING: SpringRef = 'spring.default.effects';

/** The seeking length of a driver's animation: at step 3/8, only the scroll animation's (loop's timing comes at its step). */
export const DRIVER_TIMING: CurveTiming = {
  duration: 'duration.extraLong4',
  easing: 'easing.linear',
};

/** One group for these channels, or none when there are no channels. */
function groupOf(
  channels: ReadonlySet<Channel>,
  timing: SpringRef | CurveTiming,
): TimingGroup[] {
  return channels.size > 0 ? [{ channels, timing }] : [];
}

/**
 * The groups of a play: one group when a timing is given, when the play exits, or when it is a driver; otherwise spatial
 * properties and effects take their own springs. A group has at least one channel. The delay is multiplied by the scale;
 * a driver has none.
 */
export function planTiming(
  frames: readonly StyleKeyframe[],
  request: {
    contract: Contract;
    exit?: boolean;
    timing?: SpringRef | CurveTiming;
    delay?: number;
    scale: number;
  },
): TimingPlan {
  const channels = channelsOf(frames);
  const { scale } = request;
  if (request.contract === 'driver')
    return { groups: groupOf(channels, DRIVER_TIMING), delay: 0, scale };
  const delay = (request.delay ?? 0) * scale;
  if (request.timing !== undefined)
    return { groups: groupOf(channels, request.timing), delay, scale };
  if (request.exit)
    return { groups: groupOf(channels, EXIT_SPRING), delay, scale };
  const { spatial, effects } = SPRINGS[request.contract];
  const spatialChannels = new Set(
    [...channels].filter((channel) => SPATIAL_PROPERTIES.has(channel)),
  );
  const effectChannels = new Set(
    [...channels].filter((channel) => !SPATIAL_PROPERTIES.has(channel)),
  );
  return {
    groups: [
      ...groupOf(spatialChannels, spatial),
      ...groupOf(effectChannels, effects),
    ],
    delay,
    scale,
  };
}

/** The support of a candidate easing on the WAAPI provider, as the probe of this element reports it. */
export function waapiSupport(
  element: MotionElement,
  candidate: { easing: string },
): TimingSupport {
  const { status } = probeWaapiEasing(element, candidate.easing);
  if (status === 'accepted') return 'supported';
  return status === 'refused' ? 'refused' : 'unknown';
}

const waapiTimings = new Map<
  string,
  { duration: number; easing: string } | null
>();

/**
 * Duration and easing of a timing on the WAAPI provider, or null when it cannot be played. Cached per timing
 * and scheme: easing support does not change during a page's life, so the route is resolved once.
 */
export function resolveWaapiTiming(
  target: MotionElement,
  timing: SpringRef | CurveTiming,
  scheme: MotionScheme,
): { duration: number; easing: string } | null {
  const key = `${scheme}|${typeof timing === 'string' ? timing : JSON.stringify(timing)}`;
  const cached = waapiTimings.get(key);
  if (cached !== undefined) return cached;
  const route = routeTimingWithEvaluator(
    timing,
    { scheme, backend: 'waapi' },
    (candidate) => waapiSupport(target, candidate),
  );
  const resolved =
    route.status === 'resolved'
      ? { duration: route.duration, easing: route.easing }
      : null;
  waapiTimings.set(key, resolved);
  return resolved;
}
