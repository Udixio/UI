import type { MotionHandle, VisualFrame } from '../contract.js';
import type { MotionSpec } from '../define-motion.js';
import type { Box, OwnTransform } from '../flip.js';
import type { ContentPlan, Radii } from '../project.js';
import type { MotionRuntime } from '../runtime.js';
import type { SpringParams } from '../spring.js';

/** The four fields a layout move animates. */
export type Field = 'x' | 'y' | 'scaleX' | 'scaleY';
export const FIELDS: readonly Field[] = ['x', 'y', 'scaleX', 'scaleY'];

/** A field of a spring flight: where it starts, where it lands, and its velocity at the start, per second of spring time. */
export interface FieldMotion {
  from: number;
  to: number;
  velocity: number;
}

/** The velocity of each field at one instant, per second of spring time. */
export type Velocity = Record<Field, number>;

/** What a spring flight is doing, so that its velocity can be read at any time. Its real time is spring time × timeScale. */
export interface Flight {
  params: SpringParams;
  timeScale: number; // motion scale when the flight started; a scale change between two flights is not carried (rare, accepted)
  fields: Record<Field, FieldMotion>;
}

/** A node of the content of a followed element, measured at rest: its box is relative to the centre of its parent. */
export interface ContentNode {
  element: HTMLElement;
  kind: 'box' | 'text';
  box: Box;
  children: ContentNode[];
}

/** A followed element: its last measures and the move in flight, with the content it carries. */
export interface Item {
  spec: Readonly<MotionSpec>;
  runtime: MotionRuntime;
  development: boolean;
  shared: string | undefined; // the shared identity this element holds, when it is keyed
  layout: Box | undefined; // last measured layout box
  visual: Box | undefined; // last visual box at rest
  rest: OwnTransform; // last rest transform
  handle: MotionHandle | null; // the move in flight
  flight: Flight | null; // the spring the move in flight follows; null at rest or on a curve
  content: readonly ContentNode[]; // the content, measured at rest
  contentPlan: ContentPlan[]; // the content that the move in flight carries; empty when none
  contentHandles: MotionHandle[]; // the moves of the content, which run with the move in flight
  projected: Item[]; // the followed elements that the move in flight animates as its content, at any depth
  projector: Item | null; // the followed element whose move animates this one as its content; null when it moves by itself
  // The frames and easing of the move in flight of a keyed element, with the reference its boxes are relative to: they tell
  // where it is on the screen once it is detached. Null at rest, and for an element with no shared identity.
  path: { frames: VisualFrame[]; easing: string; reference: HTMLElement } | null;
}

/** The followed elements under one root, watched together. */
export interface Scope {
  root: HTMLElement;
  items: Map<HTMLElement, Item>;
  observer: MutationObserver;
  resize: ResizeObserver;
  onScroll: () => void;
}

/** A move planned by one flush: its frames, the velocity it starts with (null from rest), the style values that decide whether it runs, its content to project when the size changes, its px corner radii when the size changes by more than 3 %, and whether it morphs from the box of another element that held its shared identity (then it has no content). */
export interface PlannedMove {
  element: HTMLElement;
  item: Item;
  frames: [VisualFrame, VisualFrame];
  velocity: Velocity | null;
  disabled: boolean;
  scale: number;
  content: ContentPlan[] | null;
  radii: Radii | null;
  morph: boolean;
}


/** A followed element that changes in a flush: the visual box it starts from, and the velocity and the live content boxes it carries (null when it carries none). */
export type Change = [HTMLElement, Item, Box, Velocity | null, Map<HTMLElement, Box> | null];

/**
 * The reference rects read by one pass. A cache is only valid between two writes: each pass that reads
 * after a write uses a fresh one.
 */
export type ReferenceRects = Map<HTMLElement, DOMRect>;

/** Mutations of these attributes never move anything: the library writes them itself. */
export const IGNORED_ATTRIBUTES = new Set(['style', 'data-presence', 'inert']);

/** Content nodes measured per followed element: the nodes beyond this budget are neither measured nor animated. */
export const CONTENT_BUDGET = 24;
/** Deepest level of content: the children of a box are measured down to this level. */
export const CONTENT_DEPTH = 3;

/**
 * What a planned move plays on the WAAPI provider, and the spring flight it follows (null for a curve). `steps` are
 * the samples of a sampled move, and `baseProgress` the progress of its move without velocity at each of them.
 */
export interface Playback {
  keyframes: VisualFrame[];
  duration: number;
  easing: string;
  flight: Flight | null;
  steps: number;
  baseProgress: ((i: number) => number) | null; // null when the move is not sampled
  styles: Array<Record<string, string>> | null; // the corner radii of each keyframe, when the element has px radii and is stretched
}
