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
    supportedVerbs: ['appear', 'disappear', 'emphasize', 'reveal', 'scrub', 'loop', 'layout'],
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
    split: ['chars', 'words', 'lines'],
    exit: ['in-place', 'out-of-flow'],
    repeat: ['once', 'always'],
    axis: ['block', 'inline'],
    range: ['enter', 'cross', 'exit', 'contain'],
    pause: ['control', 'essential'],
    visualFields: ['opacity', 'x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate', 'draw', 'along'],
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
    optional: [
      'timing',
      'reduced',
      'interrupt',
      'stagger',
      'origin',
      'split',
      'exit',
      'shared',
      'repeat',
      'axis',
      'range',
      'pause',
      'reason',
    ],
    deferred: ['direction', 'distance'],
    interruptVerbs: ['emphasize', 'layout'],
    staggerVerbs: ['appear', 'disappear', 'reveal'],
    splitVerbs: ['appear', 'disappear', 'reveal'],
    exitVerbs: ['appear', 'disappear'],
    // A layout motion takes no keyframes: it may omit them, or give an empty list. Every other verb requires them.
    keyframelessVerbs: ['layout'],
    sharedVerbs: ['layout'],
    repeatVerbs: ['reveal'],
    axisVerbs: ['reveal', 'scrub'],
    rangeVerbs: ['scrub'],
    pauseVerbs: ['loop'],
    reasonVerbs: ['loop'],
    untimedVerbs: ['scrub'],
    curveTimingVerbs: ['loop'],
    // The renders under reduced motion that a verb takes as its `reduced` option, each one a rendering the runtime gives it.
    // A verb not listed takes no `reduced`: under reduced motion it renders as `defaults[verb].reduced`, whatever its definition says.
    reducedValues: {
      appear: ['fade', 'instant'],
      disappear: ['fade', 'instant'],
      emphasize: ['static', 'fade'],
      reveal: ['instant', 'fade'],
    },
  },
  deferredDomains: {
    direction: { values: ['start', 'end', 'up', 'down'], source: '§8.2.3' },
  },
  constraints: {
    minKeyframes: 1,
    minFrameFields: 1,
    finiteVisualValues: true,
    // The fractions of a shape drawn (`draw`) or travelled along its path (`along`): from 0 to 1.
    fractionVisualFields: ['draw', 'along'],
  },
  // What each verb does when its definition sets no option: the default of each option the verb takes, and the verb's fixed
  // trigger, interruption and render under reduced motion. `reduced` is listed for every verb: `spec.reducedValues` names the
  // renders a definition may set, and the entry here is what a verb that takes none renders.
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
      // An exit has one spring: its movement fades with its opacity, so it is over within a frame of the opacity.
      timing: ['spring.default.effects'],
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
      // A loop has no spring: its default is the curve, held apart from the spring lists the other verbs read.
      timing: [],
      curve: { duration: 'duration.extraLong4', easing: 'easing.linear' },
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
};
/** The renders a verb takes as its `reduced` option (`spec.reducedValues`). */
type ReducedOf<V extends keyof typeof motionManifest.spec.reducedValues> = (typeof motionManifest.spec.reducedValues)[V][number];
type Keyed = { keyframes: [Frame, ...Frame[]] };
// Each branch names every option of the spec: the options its verb does not take are typed `never`.
export type MotionDocument = {
  version: typeof motionManifest.version;
  spec:
    | (Common &
        Keyed &
        (
          | {
              verb: Extract<Domain<'supportedVerbs'>, 'emphasize'>;
              reduced?: ReducedOf<'emphasize'>;
              interrupt?: Domain<'interrupt'>;
              stagger?: never;
              origin?: never;
              split?: never;
              exit?: never;
              shared?: never;
              repeat?: never;
              axis?: never;
              range?: never;
              pause?: never;
              reason?: never;
            }
          | {
              verb: Extract<Domain<'supportedVerbs'>, 'appear' | 'disappear'>;
              reduced?: ReducedOf<'appear' | 'disappear'>;
              interrupt?: never;
              stagger?: Domain<'stagger'>;
              origin?: Domain<'origin'>;
              split?: Domain<'split'>;
              exit?: Domain<'exit'>;
              shared?: never;
              repeat?: never;
              axis?: never;
              range?: never;
              pause?: never;
              reason?: never;
            }
          | {
              verb: Extract<Domain<'supportedVerbs'>, 'reveal'>;
              reduced?: ReducedOf<'reveal'>;
              interrupt?: never;
              stagger?: Domain<'stagger'>;
              origin?: Domain<'origin'>;
              split?: Domain<'split'>;
              exit?: never;
              shared?: never;
              repeat?: Domain<'repeat'>;
              axis?: Domain<'axis'>;
              range?: never;
              pause?: never;
              reason?: never;
            }
        ))
    | (Omit<Common, 'timing'> &
        Keyed & {
          verb: Extract<Domain<'supportedVerbs'>, 'scrub'>;
          timing?: never;
          reduced?: never;
          interrupt?: never;
          stagger?: never;
          origin?: never;
          split?: never;
          exit?: never;
          shared?: never;
          repeat?: never;
          axis?: Domain<'axis'>;
          range?: Domain<'range'>;
          pause?: never;
          reason?: never;
        })
    | (Omit<Common, 'timing'> &
        Keyed & {
          verb: Extract<Domain<'supportedVerbs'>, 'loop'>;
          timing?: CurveTiming;
          reduced?: never;
          interrupt?: never;
          stagger?: never;
          origin?: never;
          split?: never;
          exit?: never;
          shared?: never;
          repeat?: never;
          axis?: never;
          range?: never;
        } & (
          | { pause: 'control'; reason?: never }
          | { pause: 'essential'; reason: string }
        ))
    | (Common & {
        verb: Extract<Domain<'supportedVerbs'>, 'layout'>;
        keyframes?: readonly [];
        reduced?: never;
        interrupt?: Domain<'interrupt'>;
        stagger?: never;
        origin?: never;
        split?: never;
        exit?: never;
        shared?: string;
        repeat?: never;
        axis?: never;
        range?: never;
        pause?: never;
        reason?: never;
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
/** The renders a verb takes as its `reduced` option, or undefined for a verb that takes none (or a value that is not a verb). */
const rendersOf = (verb: unknown): readonly string[] | undefined =>
  typeof verb === 'string' && has(motionManifest.spec.reducedValues, verb)
    ? motionManifest.spec.reducedValues[verb as keyof typeof motionManifest.spec.reducedValues]
    : undefined;
/**
 * A form of the timing grammar: a spring token, a curve (`{ duration, easing }`), or `none` (a value written at once).
 * Each API takes the forms its nature allows (motion-manifest.json, `timing.accepts`).
 */
export type TimingForm = 'spring' | 'curve' | 'none';

/**
 * The issues of a timing, for an API that takes `forms`: one grammar for every API. A spring is a token of
 * `domains.springs`; a curve is `{ duration, easing }`, its duration a token of `domains.durations` or milliseconds above 0,
 * its easing a token of `domains.easings` or a CSS easing function, which the browser judges when it plays. A form the API
 * does not take is `unsupported`. Paths are relative to the timing: `''`, `/duration`, `/easing`.
 * @param timing - The timing, as written.
 * @param forms - The forms the API takes.
 * @returns The issues, empty when the timing is valid.
 */
export function timingIssues(timing: unknown, forms: readonly TimingForm[]): { path: string; code: MotionValidationCode }[] {
  const issues: { path: string; code: MotionValidationCode }[] = [];
  const add = (path: string, code: MotionValidationCode) => issues.push({ path, code });
  if (typeof timing === 'string') {
    if (!forms.includes('spring') && !forms.includes('none')) add('', 'unsupported');
    else if (!(forms.includes('none') && timing === 'none') && !(forms.includes('spring') && contains(motionManifest.domains.springs, timing))) add('', 'invalid_value');
  } else if (!object(timing)) add('', 'type');
  else if (!forms.includes('curve')) add('', 'unsupported');
  else {
    for (const key of Object.keys(timing)) if (key !== 'duration' && key !== 'easing') add(pointer('', key), 'unknown_field');
    const { duration, easing } = timing;
    if (!has(timing, 'duration')) add('/duration', 'required');
    else if (typeof duration === 'number') {
      if (!(duration > 0 && duration < Infinity)) add('/duration', 'invalid_value');
    } else if (typeof duration !== 'string') add('/duration', 'type');
    else if (!contains(motionManifest.domains.durations, duration)) add('/duration', 'invalid_value');
    if (!has(timing, 'easing')) add('/easing', 'required');
    else if (typeof easing !== 'string') add('/easing', 'type');
    else if (easing === '' || (easing.startsWith('easing.') && !contains(motionManifest.domains.easings, easing))) add('/easing', 'invalid_value');
  }
  return issues;
}
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
        const keyframeless =
          typeof spec.verb === 'string' &&
          contains(motionManifest.spec.keyframelessVerbs, spec.verb);
        required(
          spec,
          '/spec',
          motionManifest.spec.required.filter(
            key => key !== 'keyframes' || !keyframeless,
          ),
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
          else if (keyframeless) {
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
                    else if (
                      contains(motionManifest.constraints.fractionVisualFields, key) &&
                      (frame[key] < 0 || frame[key] > 1)
                    )
                      add(pointer(path, key), 'invalid_value');
                  }
              }
            });
        }
        // A verb takes the fields listed for it; any other known verb refuses them.
        const verbIs = (verbs: readonly string[]) =>
          typeof spec.verb === 'string' && contains(verbs, spec.verb);
        const verbIsNot = (verbs: readonly string[]) =>
          typeof spec.verb === 'string' && !contains(verbs, spec.verb);
        if (has(spec, 'timing')) {
          // A scroll-driven scrub takes no timing; a loop takes a curve, never a spring.
          const forms: readonly TimingForm[] = verbIs(motionManifest.spec.untimedVerbs)
            ? []
            : verbIs(motionManifest.spec.curveTimingVerbs)
              ? ['curve']
              : ['spring', 'curve'];
          for (const issue of timingIssues(spec.timing, forms)) add(`/spec/timing${issue.path}`, issue.code);
        }
        // A verb takes the renders listed for it; scrub, loop and layout render as their default under reduced motion.
        if (has(spec, 'reduced')) {
          const renders = rendersOf(spec.verb);
          if (renders === undefined && typeof spec.verb === 'string') add('/spec/reduced', 'unsupported');
          else domain(spec.reduced, '/spec/reduced', renders ?? motionManifest.domains.reduced);
        }
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
        // The split, view, scroll and loop fields: each one is refused by the verbs that do not list it.
        for (const [key, verbs, values] of [
          ['split', motionManifest.spec.splitVerbs, motionManifest.domains.split],
          ['repeat', motionManifest.spec.repeatVerbs, motionManifest.domains.repeat],
          ['axis', motionManifest.spec.axisVerbs, motionManifest.domains.axis],
          ['range', motionManifest.spec.rangeVerbs, motionManifest.domains.range],
          ['pause', motionManifest.spec.pauseVerbs, motionManifest.domains.pause],
        ] as const)
          if (has(spec, key)) {
            if (verbIsNot(verbs)) add(`/spec/${key}`, 'unsupported');
            else domain(spec[key], `/spec/${key}`, values);
          }
        // A loop says whether it may be paused: every loop has a pause, and an essential one gives its reason.
        if (verbIs(motionManifest.spec.pauseVerbs)) {
          required(spec, '/spec', ['pause']);
          if (spec.pause === 'essential') required(spec, '/spec', ['reason']);
        }
        if (has(spec, 'reason')) {
          if (verbIsNot(motionManifest.spec.reasonVerbs)) add('/spec/reason', 'unsupported');
          else if (spec.pause === 'control') add('/spec/reason', 'conflict');
          else if (typeof spec.reason !== 'string') add('/spec/reason', 'type');
          else if (spec.reason.trim() === '') add('/spec/reason', 'empty');
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
