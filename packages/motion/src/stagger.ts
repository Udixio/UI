import { deferredHandle } from './compose.js';
import type { MotionHandle } from './contract.js';
import { layoutScopeOf } from './scope-of.js';

type Origin = 'first' | 'last' | 'center';
type Step = 'tight' | 'normal' | 'loose';
type Phase = 'enter' | 'exit';
type Box = { top: number; left: number; height: number };
type Entry = {
  target: HTMLElement;
  group: object;
  scope: HTMLElement;
  options: StaggerOptions;
  play: (delay: number) => MotionHandle;
  deferred: ReturnType<typeof deferredHandle>;
};

export interface StaggerOptions {
  stagger: Step;
  origin?: Origin;
  reduced: boolean;
  /** Entries and exits of one definition are cascaded apart. */
  phase: Phase;
}

/** Step of each token, and cap, when the stylesheet does not provide them (ms). */
const FALLBACK_STEP: Record<Step, number> = { tight: 20, normal: 50, loose: 100 };
const FALLBACK_MAX = 400;

/** Entries waiting for their batch to be measured; the batch runs in one microtask. */
let queue: Entry[] = [];

/** A CSS time in milliseconds (`50ms`, `0.05s`), or the fallback when it is missing or not a time. */
function milliseconds(value: string, fallback: number): number {
  const match = /^\s*(\d*\.?\d+)(ms|s)\s*$/.exec(value);
  if (!match) return fallback;
  return match[2] === 's' ? Number(match[1]) * 1000 : Number(match[1]);
}

/** Rank of each box in visual order (top, then left), counted from `origin`. */
export function visualRanks(boxes: ReadonlyArray<Box>, origin: Origin): number[] {
  const rows: number[][] = [];
  const byTop = boxes.map((_, index) => index).sort((a, b) => boxes[a].top - boxes[b].top);
  for (const index of byTop) {
    const row = rows[rows.length - 1];
    const first = row?.[0];
    if (first !== undefined && Math.abs(boxes[index].top - boxes[first].top) < Math.min(boxes[index].height, boxes[first].height) / 2) row.push(index);
    else rows.push([index]);
  }
  const visual = rows.flatMap(row => row.sort((a, b) => boxes[a].left - boxes[b].left));
  const count = visual.length;
  const ranks: number[] = new Array(count);
  visual.forEach((index, position) => {
    if (origin === 'last') ranks[index] = count - 1 - position;
    else if (origin === 'center') ranks[index] = Math.round(Math.abs(position - (count - 1) / 2));
    else ranks[index] = position;
  });
  return ranks;
}

/** Delay of a rank, capped. */
export function staggerDelay(rank: number, step: number, max: number): number {
  return Math.min(rank * step, max);
}

/**
 * Start `play` with the delay of `target` among the elements of the same group (the same definition, in the
 * same layout scope, entering or leaving) asking in the same task. Returns at once a handle that stands for the animation until
 * the batch runs in a microtask.
 */
export function staggered(target: HTMLElement, group: object, options: StaggerOptions, play: (delay: number) => MotionHandle): MotionHandle {
  const deferred = deferredHandle();
  if (queue.length === 0) queueMicrotask(flushQueue);
  queue.push({ target, group, scope: layoutScopeOf(target), options, play, deferred });
  return deferred.handle;
}

/** The value under `key`, created by `make` when it is missing. */
function slot<K, V>(map: Map<K, V>, key: K, make: () => V): V {
  let value = map.get(key);
  if (value === undefined) map.set(key, (value = make()));
  return value;
}

/** The queued entries of each group, scope and phase, in order of arrival. */
function partition(entries: Entry[]): Entry[][] {
  const byGroup = new Map<object, Map<HTMLElement, Map<Phase, Entry[]>>>();
  for (const entry of entries) {
    const byScope = slot(byGroup, entry.group, () => new Map<HTMLElement, Map<Phase, Entry[]>>());
    const byPhase = slot(byScope, entry.scope, () => new Map<Phase, Entry[]>());
    slot(byPhase, entry.options.phase, () => []).push(entry);
  }
  return [...byGroup.values()].flatMap(byScope => [...byScope.values()].flatMap(byPhase => [...byPhase.values()]));
}

/** The delay of each member: none when it is alone or motion is reduced, else its visual rank times the step. */
function delaysOf(members: Entry[]): Array<[Entry, number]> {
  const { options } = members[0];
  if (members.length === 1 || options.reduced) return members.map(entry => [entry, 0]);
  const first = members[0].target;
  const style = (first.ownerDocument.defaultView ?? window).getComputedStyle(first);
  const step = milliseconds(style.getPropertyValue(`--udx-motion-stagger-${options.stagger}`), FALLBACK_STEP[options.stagger]);
  const max = milliseconds(style.getPropertyValue('--udx-motion-stagger-max'), FALLBACK_MAX);
  const ranks = visualRanks(members.map(entry => entry.target.getBoundingClientRect()), options.origin ?? 'first');
  return members.map((entry, index) => [entry, staggerDelay(ranks[index], step, max)]);
}

/** Measure the batch (reads), then start its animations (writes). Entries cancelled before the batch never start. */
function flushQueue(): void {
  const entries = queue;
  queue = [];
  const delays = new Map<Entry, number>();
  for (const members of partition(entries.filter(entry => !entry.deferred.cancelled)))
    for (const [entry, delay] of delaysOf(members)) delays.set(entry, delay);
  for (const entry of entries)
    if (!entry.deferred.cancelled) entry.deferred.resolve(entry.play(delays.get(entry) ?? 0));
}
