import { curveData } from './curve-data.generated.js';
import type { CurveTiming, DurationToken, EasingToken } from './tokens.js';

/** Motion names and shared identities are kebab-case. */
export const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

/** Experimental JSON contract; it does not register or execute motion. */
export const motionManifest = freezeDeep({
  version: 1,
  domains: {
    verbs: [
      'appear',
      'disappear',
      'emphasize',
      'reveal',
      'scrub',
      'loop',
      'layout',
    ],
    supportedVerbs: ['appear', 'disappear', 'emphasize', 'layout'],
    springs: [
      'spring.fast.spatial',
      'spring.fast.effects',
      'spring.default.spatial',
      'spring.default.effects',
      'spring.slow.spatial',
      'spring.slow.effects',
    ],
    durations: Object.keys(curveData.duration).map(key => `duration.${key}` as DurationToken),
    easings: Object.keys(curveData.easing).map(key => `easing.${key}` as EasingToken),
    reduced: ['fade', 'instant', 'static', 'neutral', 'frozen'],
    interrupt: ['carry', 'restart'],
    stagger: ['tight', 'normal', 'loose'],
    origin: ['first', 'last', 'center'],
    exit: ['in-place', 'out-of-flow'],
    visualFields: ['opacity', 'x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate'],
    deferredVisualFields: [
      'color',
      'backgroundColor',
      'clipPath',
      'blur',
    ],
  },
  envelope: { required: ['version', 'spec'] },
  spec: {
    required: ['verb', 'keyframes'],
    optional: ['timing', 'reduced', 'interrupt', 'stagger', 'origin', 'exit', 'shared'],
    deferred: [
      'repeat',
      'direction',
      'distance',
      'range',
      'axis',
      'pause',
      'reason',
    ],
    interruptVerbs: ['emphasize', 'layout'],
    staggerVerbs: ['appear', 'disappear'],
    exitVerbs: ['appear', 'disappear'],
    sharedVerbs: ['layout'],
  },
  deferredDomains: {
    repeat: { values: ['once', 'always'], source: '§8.2.3' },
    direction: { values: ['start', 'end', 'up', 'down'], source: '§8.2.3' },
    axis: { values: ['block', 'inline'], source: '§8.2.3' },
    pause: { values: ['control', 'essential'], source: '§8.2.3' },
  },
  constraints: {
    minKeyframes: 1,
    minFrameFields: 1,
    finiteVisualValues: true,
  },
  defaults: {
    appear: {
      trigger: 'load',
      interrupt: 'carry',
      reduced: 'fade',
      timing: ['spring.default.spatial', 'spring.default.effects'],
    },
    disappear: {
      trigger: 'unmount',
      interrupt: 'carry',
      reduced: 'fade',
      timing: ['spring.default.spatial', 'spring.default.effects'],
    },
    emphasize: {
      trigger: 'state',
      interrupt: 'restart',
      reduced: 'static',
      timing: ['spring.fast.spatial'],
    },
    reveal: {
      trigger: 'view',
      interrupt: 'restart',
      reduced: 'instant',
      timing: ['spring.default.spatial'],
    },
    scrub: {
      trigger: 'scroll',
      interrupt: 'carry',
      reduced: 'neutral',
      timing: [],
    },
    loop: {
      trigger: 'load',
      interrupt: 'restart',
      reduced: 'frozen',
      timing: ['linear-token'],
      pause: 'required',
    },
    layout: {
      trigger: 'state',
      interrupt: 'carry',
      reduced: 'instant',
      timing: ['spring.default.spatial'],
    },
  },
  reserved: {
    names: [
      'enter',
      'exit',
      'in',
      'out',
      'transition',
      'animate',
      'initial',
      'AnimatePresence',
    ],
    prefixes: ['view-transition-'],
    exhaustive: false,
    source: '§8.1',
  },
} as const);
type Domain<K extends keyof typeof motionManifest.domains> =
  (typeof motionManifest.domains)[K][number];
export type ManifestVerb = Domain<'verbs'>;
export type ManifestSpringRef = Domain<'springs'>;
export type ManifestDurationToken = DurationToken;
export type ManifestEasingToken = EasingToken;
export type ManifestCurveTiming = CurveTiming;
export type ManifestReduced = Domain<'reduced'>;
export type ManifestVisualField = Domain<'visualFields'>;
type Frame = {
  [K in ManifestVisualField]: Required<
    Pick<Record<ManifestVisualField, number>, K>
  > &
    Partial<Record<Exclude<ManifestVisualField, K>, number>>;
}[ManifestVisualField];
type Common = {
  timing?: ManifestSpringRef | CurveTiming;
  reduced?: ManifestReduced;
};
export type MotionDocument = {
  version: typeof motionManifest.version;
  spec:
    | (Common &
        { keyframes: [Frame, ...Frame[]] } &
        (
          | {
              verb: Extract<Domain<'supportedVerbs'>, 'emphasize'>;
              interrupt?: Domain<'interrupt'>;
              stagger?: never;
              origin?: never;
              exit?: never;
              shared?: never;
            }
          | {
              verb: Exclude<Domain<'supportedVerbs'>, 'emphasize' | 'layout'>;
              interrupt?: never;
              stagger?: Domain<'stagger'>;
              origin?: Domain<'origin'>;
              exit?: Domain<'exit'>;
              shared?: never;
            }
        ))
    | (Common & {
        verb: Extract<Domain<'supportedVerbs'>, 'layout'>;
        keyframes?: readonly [];
        interrupt?: Domain<'interrupt'>;
        stagger?: never;
        origin?: never;
        exit?: never;
        shared?: string;
      });
};
export type MotionValidationCode =
  | 'type'
  | 'required'
  | 'unknown_field'
  | 'unsupported'
  | 'invalid_value'
  | 'empty'
  | 'conflict'
  | 'unsupported_version';
export type MotionValidationError = {
  path: string;
  code: MotionValidationCode;
  message: string;
};
export type MotionValidationResult =
  | { valid: true; value: MotionDocument }
  | { valid: false; errors: MotionValidationError[] };
const has = (obj: object, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key);
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const contains = (values: readonly string[], value: string) =>
  values.includes(value);
const pointer = (base: string, key: string) =>
  `${base}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`;
/** Validate a parsed JSON value without mutation or default injection. */
export function validateMotionDocument(input: unknown): MotionValidationResult {
  const errors: MotionValidationError[] = [];
  const add = (path: string, code: MotionValidationCode) =>
    errors.push({
      path,
      code,
      message: `Motion manifest v${motionManifest.version}: ${code}`,
    });
  const fields = (
    value: Record<string, unknown>,
    base: string,
    allowed: readonly string[],
    deferred: readonly string[] = [],
  ) => {
    for (const key of Object.keys(value))
      if (!contains(allowed, key))
        add(
          pointer(base, key),
          contains(deferred, key) ? 'unsupported' : 'unknown_field',
        );
  };
  const required = (
    value: Record<string, unknown>,
    base: string,
    keys: readonly string[],
  ) => {
    for (const key of keys)
      if (!has(value, key)) add(pointer(base, key), 'required');
  };
  const domain = (value: unknown, path: string, values: readonly string[]) => {
    if (typeof value !== 'string') add(path, 'type');
    else if (!contains(values, value)) add(path, 'invalid_value');
  };
  if (!object(input)) add('', 'type');
  else {
    fields(input, '', motionManifest.envelope.required);
    required(input, '', motionManifest.envelope.required);
    let versionValid = false;
    if (has(input, 'version')) {
      const version = input.version;
      if (typeof version !== 'number') add('/version', 'type');
      else if (!Number.isInteger(version)) add('/version', 'invalid_value');
      else if (version !== motionManifest.version)
        add('/version', 'unsupported_version');
      else versionValid = true;
    }
    if (versionValid && has(input, 'spec')) {
      const spec = input.spec;
      if (!object(spec)) add('/spec', 'type');
      else {
        fields(
          spec,
          '/spec',
          [...motionManifest.spec.required, ...motionManifest.spec.optional],
          motionManifest.spec.deferred,
        );
        // A layout motion has no keyframes: they may be absent, or present and empty.
        const layout = spec.verb === 'layout';
        required(
          spec,
          '/spec',
          motionManifest.spec.required.filter(key => !layout || key !== 'keyframes'),
        );
        if (has(spec, 'verb')) {
          if (typeof spec.verb !== 'string') add('/spec/verb', 'type');
          else if (!contains(motionManifest.domains.verbs, spec.verb))
            add('/spec/verb', 'invalid_value');
          else if (!contains(motionManifest.domains.supportedVerbs, spec.verb))
            add('/spec/verb', 'unsupported');
        }
        if (has(spec, 'keyframes')) {
          if (!Array.isArray(spec.keyframes)) add('/spec/keyframes', 'type');
          else if (layout) {
            if (spec.keyframes.length > 0) add('/spec/keyframes', 'unsupported');
          } else if (
            spec.keyframes.length < motionManifest.constraints.minKeyframes
          )
            add('/spec/keyframes', 'empty');
          else
            spec.keyframes.forEach((frame: unknown, index: number) => {
              const path = `/spec/keyframes/${index}`;
              if (!object(frame)) add(path, 'type');
              else {
                const keys = Object.keys(frame);
                if (keys.length < motionManifest.constraints.minFrameFields)
                  add(path, 'empty');
                fields(
                  frame,
                  path,
                  motionManifest.domains.visualFields,
                  motionManifest.domains.deferredVisualFields,
                );
                if (
                  has(frame, 'scale') &&
                  (has(frame, 'scaleX') || has(frame, 'scaleY'))
                )
                  add(path, 'conflict');
                for (const key of keys)
                  if (contains(motionManifest.domains.visualFields, key)) {
                    if (typeof frame[key] !== 'number')
                      add(pointer(path, key), 'type');
                    else if (
                      motionManifest.constraints.finiteVisualValues &&
                      !Number.isFinite(frame[key])
                    )
                      add(pointer(path, key), 'invalid_value');
                  }
              }
            });
        }
        if (has(spec, 'timing')) {
          const timing = spec.timing;
          if (typeof timing === 'string') domain(timing, '/spec/timing', motionManifest.domains.springs);
          else if (!object(timing)) add('/spec/timing', 'type');
          else {
            fields(timing, '/spec/timing', ['duration', 'easing']);
            required(timing, '/spec/timing', ['duration', 'easing']);
            if (has(timing, 'duration')) domain(timing.duration, '/spec/timing/duration', motionManifest.domains.durations);
            if (has(timing, 'easing')) domain(timing.easing, '/spec/timing/easing', motionManifest.domains.easings);
          }
        }
        if (has(spec, 'reduced'))
          domain(spec.reduced, '/spec/reduced', motionManifest.domains.reduced);
        if (has(spec, 'interrupt')) {
          if (
            has(spec, 'verb') &&
            typeof spec.verb === 'string' &&
            !contains(motionManifest.spec.interruptVerbs, spec.verb)
          )
            add('/spec/interrupt', 'unsupported');
          else
            domain(
              spec.interrupt,
              '/spec/interrupt',
              motionManifest.domains.interrupt,
            );
        }
        // The cascade belongs to presence verbs only; origin without stagger is accepted.
        for (const key of ['stagger', 'origin'] as const)
          if (has(spec, key)) {
            if (
              has(spec, 'verb') &&
              typeof spec.verb === 'string' &&
              !contains(motionManifest.spec.staggerVerbs, spec.verb)
            )
              add(`/spec/${key}`, 'unsupported');
            else domain(spec[key], `/spec/${key}`, motionManifest.domains[key]);
          }
        // An exit belongs to presence verbs only: it tells how the neighbours of a leaving element move.
        if (has(spec, 'exit')) {
          if (
            has(spec, 'verb') &&
            typeof spec.verb === 'string' &&
            !contains(motionManifest.spec.exitVerbs, spec.verb)
          )
            add('/spec/exit', 'unsupported');
          else domain(spec.exit, '/spec/exit', motionManifest.domains.exit);
        }
        // A shared identity belongs to layout motions only: the element keeps it while its layout is followed.
        if (has(spec, 'shared')) {
          if (
            has(spec, 'verb') &&
            typeof spec.verb === 'string' &&
            !contains(motionManifest.spec.sharedVerbs, spec.verb)
          )
            add('/spec/shared', 'unsupported');
          else if (typeof spec.shared !== 'string') add('/spec/shared', 'type');
          else if (!NAME_PATTERN.test(spec.shared)) add('/spec/shared', 'invalid_value');
        }
      }
    }
  }
  errors.sort((a, b) =>
    a.path < b.path
      ? -1
      : a.path > b.path
        ? 1
        : a.code < b.code
          ? -1
          : a.code > b.code
            ? 1
            : 0,
  );
  return errors.length
    ? { valid: false, errors }
    : { valid: true, value: input as MotionDocument };
}
