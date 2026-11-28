import type { AxisBase } from './axis-base.js';

/**
 * One keyframe: CSS values by camelCase property name (`borderRadius`) or custom property (`--x`). A number is unitless
 * (`opacity`), `null` keeps the underlying value, and `offset` places the keyframe along the motion; `auto` on a width or
 * height is measured to pixels, and a motion that ends on it leaves no inline size; a custom property interpolates only once
 * it is registered with `@property`.
 */
export type StyleKeyframe = Record<string, string | number | null> & {
  offset?: number;
};

/** A channel: a CSS property name (kebab-case), or one of 'x', 'y', 'scaleX', 'scaleY'. */
export type Channel = string;

const SIDES = ['top', 'right', 'bottom', 'left'];
const LOGICAL_SIDES = [
  'block',
  'block-start',
  'block-end',
  'inline',
  'inline-start',
  'inline-end',
];

/** A shorthand, its four sides and its logical longhands. */
const boxLonghands = (name: string): string[] => [
  name,
  ...SIDES.map((side) => `${name}-${side}`),
  ...LOGICAL_SIDES.map((side) => `${name}-${side}`),
];

/**
 * The spatial properties of the motion model, in CSS names: a motion on one of them takes the spatial spring. An unknown
 * property is an effect.
 */
export const SPATIAL_PROPERTIES: ReadonlySet<string> = new Set([
  'x',
  'y',
  'scaleX',
  'scaleY',
  'translate',
  'scale',
  'rotate',
  'transform',
  'offset-distance',
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'inline-size',
  'block-size',
  'min-inline-size',
  'max-inline-size',
  'min-block-size',
  'max-block-size',
  'inset',
  ...SIDES,
  ...LOGICAL_SIDES.map((side) => `inset-${side}`),
  ...boxLonghands('margin'),
  ...boxLonghands('padding'),
  'gap',
  'row-gap',
  'column-gap',
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
]);

/** The channels a whole shorthand claims. */
const CHANNELS_BY_KEY = new Map<string, readonly Channel[]>([
  ['x', ['x']],
  ['y', ['y']],
  ['scaleX', ['scaleX']],
  ['scaleY', ['scaleY']],
  ['translate', ['x', 'y']],
  ['scale', ['scaleX', 'scaleY']],
]);

/** The CSS property each axis channel writes. */
const PROPERTY_BY_CHANNEL = new Map<string, string>([
  ['x', 'translate'],
  ['y', 'translate'],
  ['scaleX', 'scale'],
  ['scaleY', 'scale'],
]);

/** The fields the reader does not read yet: `draw` and `along` are the old path's until step 4/8. */
const NOT_READ = new Set(['offset', 'draw', 'along']);

/** The camelCase property in CSS names; a custom property keeps its name. */
export const cssName = (key: string): string =>
  key.startsWith('--')
    ? key
    : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/**
 * The WAAPI key of a property: camelCase, because WAAPI ignores a kebab-case key; a custom property keeps its name, and a
 * camelCase key stays as it is.
 */
const waapiName = (key: string): string =>
  key.startsWith('--')
    ? key
    : key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

/** The entries of a frame that it writes: no offset, no unread field, no `null`. */
function writtenEntries(frame: StyleKeyframe): [string, string | number][] {
  return Object.entries(frame).filter(
    (entry): entry is [string, string | number] =>
      entry[1] !== null && !NOT_READ.has(entry[0]),
  );
}

/** The channels one key of a frame writes. */
function channelsOfKey(key: string): readonly Channel[] {
  return CHANNELS_BY_KEY.get(key) ?? [cssName(key)];
}

/** The frames of a motion: at least one keyframe, each holding a property (`offset`, `draw` and `along` are not properties). */
export type MotionFrames = readonly [StyleKeyframe, ...StyleKeyframe[]];

/**
 * Whether a list is the frames of a motion: at least one keyframe, and each one holds a property the reader reads.
 * @param frames - The keyframes, as a list.
 * @returns Whether the list is `MotionFrames`.
 */
export function isMotionFrames(
  frames: readonly StyleKeyframe[],
): frames is MotionFrames {
  return (
    frames.length > 0 &&
    frames.every((frame) =>
      Object.keys(frame).some(
        (key) => !NOT_READ.has(key) && frame[key] !== undefined,
      ),
    )
  );
}

/**
 * The keyframes given as one frame or as a list, as a list.
 * @param keyframes - One keyframe, or a list of them.
 * @returns The list: the array given, or a list of the one frame.
 */
export function keyframeList(
  keyframes: StyleKeyframe | readonly StyleKeyframe[],
): readonly StyleKeyframe[] {
  return isList(keyframes) ? keyframes : [keyframes];
}

/**
 * The frames of a motion, as a list, shorthands kept. Throws on an empty list, on a keyframe that holds no property, and,
 * deliberately, on a frame that writes `translate` (or `scale`) together with `x` or `y` (or `scaleX` or `scaleY`):
 * both would set one property twice.
 * @param keyframes - One keyframe, or a list of them.
 * @returns The frames.
 */
export function readKeyframes(
  keyframes: StyleKeyframe | readonly StyleKeyframe[],
): MotionFrames {
  const frames = keyframeList(keyframes);
  if (frames.length === 0)
    throw new TypeError('A motion needs at least one keyframe');
  if (!isMotionFrames(frames))
    throw new TypeError(
      'A keyframe needs at least one property: offset, draw and along are not properties',
    );
  for (const frame of frames) {
    const keys = new Set(writtenEntries(frame).map(([key]) => key));
    if (keys.has('translate') && (keys.has('x') || keys.has('y')))
      throw new TypeError('A keyframe writes translate, or x and y, not both');
    if (keys.has('scale') && (keys.has('scaleX') || keys.has('scaleY')))
      throw new TypeError(
        'A keyframe writes scale, or scaleX and scaleY, not both',
      );
  }
  return frames;
}

/** Whether the keyframes given to `keyframeList` are a list. */
function isList(
  keyframes: StyleKeyframe | readonly StyleKeyframe[],
): keyframes is readonly StyleKeyframe[] {
  return Array.isArray(keyframes);
}

/** The channels a set of frames writes. */
export function channelsOf(
  frames: readonly StyleKeyframe[],
): ReadonlySet<Channel> {
  const channels = new Set<Channel>();
  for (const frame of frames) {
    for (const [key] of writtenEntries(frame))
      for (const channel of channelsOfKey(key)) channels.add(channel);
  }
  return channels;
}

/** The CSS property a channel writes: `x` and `y` write `translate`, `scaleX` and `scaleY` write `scale`, any other is its own. */
export function propertyOf(channel: Channel): string {
  return PROPERTY_BY_CHANNEL.get(channel) ?? channel;
}

/** A length: a number is in px, a string is taken as written. */
const length = (value: string | number): string =>
  typeof value === 'number' ? `${value}px` : value;

/** An angle: a number is in degrees, a string is taken as written. */
const angle = (value: string | number): string =>
  typeof value === 'number' ? `${value}deg` : value;

/** The value of a channel in a frame, or the base's when the frame does not name it. */
function axisOr(
  values: ReadonlyMap<string, string | number>,
  key: string,
  fallback: string,
  format: (value: string | number) => string,
): string {
  const value = values.get(key);
  return value === undefined ? fallback : format(value);
}

/**
 * WAAPI keyframes for the given channels only. A frame that moves one axis of `translate` or `scale` writes the whole
 * property, and the axis it does not name is taken from `base`, so it keeps the value the element has (never 0 by default).
 */
export function toWaapiKeyframes(
  frames: readonly StyleKeyframe[],
  channels: ReadonlySet<Channel>,
  base: AxisBase,
): Keyframe[] {
  return frames.map((frame) => {
    const keyframe: Keyframe = {};
    if (frame.offset !== undefined) keyframe.offset = frame.offset;
    const written = writtenEntries(frame).filter(([key]) =>
      channelsOfKey(key).some((channel) => channels.has(channel)),
    );
    const values = new Map(written);
    for (const [key, value] of written) {
      if (key === 'x' || key === 'y' || key === 'scaleX' || key === 'scaleY')
        continue;
      if (key === 'translate') keyframe.translate = length(value);
      else if (key === 'scale') keyframe.scale = String(value);
      else if (key === 'rotate') keyframe.rotate = angle(value);
      else keyframe[waapiName(key)] = value;
    }
    if (values.has('x') || values.has('y')) {
      const parts = [
        axisOr(values, 'x', base.x, length),
        axisOr(values, 'y', base.y, length),
      ];
      if (base.z !== undefined) parts.push(base.z);
      keyframe.translate = parts.join(' ');
    }
    if (values.has('scaleX') || values.has('scaleY')) {
      const parts = [
        axisOr(values, 'scaleX', String(base.scaleX), String),
        axisOr(values, 'scaleY', String(base.scaleY), String),
      ];
      if (base.scaleZ !== undefined) parts.push(String(base.scaleZ));
      keyframe.scale = parts.join(' ');
    }
    return keyframe;
  });
}
