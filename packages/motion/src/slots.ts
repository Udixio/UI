// The per-kind slots of the elements, and what animates their properties now. A small module that the main entry and the
// `animate` entry share: a component that animates its own element with `animateStyle` reserves its kind here, where
// `motion()` reads it.
import { settledHandle } from './compose.js';
import type { MotionBinding } from './bind.js';
import type { MotionKind, MotionSpec } from './define-motion.js';

/**
 * The motion of each kind on an element, at most one per kind: a binding of `motion()`, or the slot of a kind a component
 * reserves (`reserveMotion`). An element declared with no box shares the map of its box.
 */
export const bindings = new WeakMap<Element, Map<MotionKind, MotionBinding>>();
/** The name a binding was made from, when it was made from a name or a definition. */
export const names = new WeakMap<MotionBinding, string>();
/** The elements reported in development for a motion left out (its kind is held, or the element has no box): once per element. */
const reportedKinds = new WeakSet<Element>();

/** The outcome of a presence that has nothing to wait for: already settled, and shared. */
export const settled = Promise.resolve<'finished' | 'cancelled'>('finished');

/** The name a binding was made from, if it was made from a defined motion. */
export function nameOf(binding: MotionBinding): string | undefined {
  return names.get(binding);
}

/** A kind with its article, as a message says it: "a presence", "an emphasis". */
const withArticle = (kind: MotionKind): string => `${kind.startsWith('e') ? 'an' : 'a'} ${kind}`;

/** Report a motion left out on an element, once per element, in development. */
function reportIgnored(target: Element, message: string): void {
  if (reportedKinds.has(target)) return;
  reportedKinds.add(target);
  console.error(`[@udixio/motion] ${message}`);
}

/**
 * Report in development, once per element, a motion left out because the element already has one of its kind: `connectMotion`
 * and `motionsWhenDefined` keep the first listed name of each kind.
 */
export function reportSameKind(target: Element, ignored: string, kept: string, kind: MotionKind): void {
  reportIgnored(
    target,
    `"${ignored}" ignored on an element that already has a ${kind} motion ("${kept}"): an element carries one motion of each kind, the first listed.`,
  );
}

/** Report in development, once per element, a motion left out because a component holds its kind there (`reserveMotion`). */
export function reportReserved(target: Element, ignored: string, owner: string, kind: MotionKind): void {
  reportIgnored(
    target,
    `"${ignored}" ignored: ${owner} already holds ${withArticle(kind)} on this element, for its own animation: an element carries one motion of each kind.`,
  );
}

/** Report in development, once per element, a motion left out because the element has no box to give (`data-motion-box="none"`). */
export function reportNoBox(target: Element, ignored: string, label: string): void {
  reportIgnored(
    target,
    `"${ignored}" ignored: ${label} has no box to give (data-motion-box="none"): its component shows its surface elsewhere (a portal, the top layer). Animate the component with its own motion prop.`,
  );
}

/**
 * A binding that does nothing: the slot of a reserved kind (its `owner` set, no verb), or a motion left out (its own verb).
 * `setPresent` resolves `'finished'` at once, `play` returns undefined for a presence and a finished handle otherwise, `pause`
 * and `destroy` do nothing: the element is never touched.
 */
export function inertBinding(kind: MotionKind, verb: MotionSpec['verb'] | null, owner?: string): MotionBinding {
  return {
    handle: null,
    present: true,
    verb,
    kind,
    ...(owner !== undefined && { owner }),
    play: () => (kind === 'presence' ? undefined : settledHandle()),
    pause() {},
    setPresent: () => settled,
    destroy() {},
  };
}

/**
 * Reserve kinds of an element for a component's own animations: the element holds them as it would hold motions, so that a
 * motion of one of those kinds bound there (by `motion()`, an adapter, `data-motion`, or on a host declared with no box whose
 * box it is) is ignored, and development names the owner: `"pop" ignored: Snackbar already holds a presence on this element`.
 * A motion of the kind bound before the reservation is destroyed, with the same report. `getMotion`, `getMotions` and
 * `inspect` show each reserved kind as a binding whose `owner` is set and whose `verb` is null; its calls do nothing, and
 * neither its `destroy()` nor `revert()` frees it: only the release does.
 *
 * A component reserves what it animates itself on the element: `presence` for an element it shows and hides, `emphasis` for a
 * feedback it plays on interaction, `layout` for a size it animates. The other kinds stay free for the author.
 * @param element - The element the component animates, the one a motion bound on the component would move.
 * @param kinds - The kind, or the kinds, the component holds there.
 * @param owner - The component, as development names it (`Snackbar`).
 * @returns The release: it frees each kind still held by this reservation. A later reservation of a kind replaces this one.
 *
 * @example
 * ```ts
 * // A third-party component that fades its own panel in and out.
 * const release = reserveMotion(panel, 'presence', 'Toast');
 * // … when the component is destroyed:
 * release();
 * ```
 */
export function reserveMotion(element: Element, kinds: MotionKind | readonly MotionKind[], owner: string): () => void {
  const slots = (typeof kinds === 'string' ? [kinds] : kinds).map(kind => {
    const held = bindings.get(element)?.get(kind);
    if (held && held.owner === undefined) {
      if (__MOTION_CHECKS__) reportReserved(element, nameOf(held) ?? `a ${held.verb} motion`, owner, kind);
      held.destroy();
    }
    let slots = bindings.get(element);
    if (!slots) bindings.set(element, (slots = new Map()));
    const slot = inertBinding(kind, null, owner);
    slots.set(kind, slot);
    return slot;
  });
  return () => {
    for (const slot of slots) {
      const held = bindings.get(element);
      if (held?.get(slot.kind) !== slot) continue;
      held.delete(slot.kind);
      if (held.size === 0) bindings.delete(element);
    }
  };
}

/** The component that reserves a kind of an element, if one does. */
export function ownerOf(element: Element): string | undefined {
  for (const binding of bindings.get(element)?.values() ?? []) if (binding.owner !== undefined) return binding.owner;
  return undefined;
}

/**
 * What animates CSS properties of an element now: a motion of `animateStyle`, which a new motion of the same properties
 * cancels (`cancel`), and in development a motion bound by `motion()`, which is only listed (no `cancel`). `source` names it in
 * development.
 */
export interface RunningStyle {
  readonly properties: readonly string[];
  readonly source?: string;
  readonly cancel?: () => void;
}

/** The motions running on each element, by the properties they animate. */
export const running = new WeakMap<Element, Set<RunningStyle>>();
/** The elements reported in development for two sources on one property: once per element. */
const reportedSources = new WeakSet<Element>();

/** List a running motion of an element; it is listed until `unlist`. */
export function listRunning(element: Element, entry: RunningStyle): void {
  let entries = running.get(element);
  if (!entries) running.set(element, (entries = new Set()));
  entries.add(entry);
}

/** Forget a running motion of an element. */
export function unlistRunning(element: Element, entry: RunningStyle): void {
  running.get(element)?.delete(entry);
}

/**
 * Development: report once per element a property that a component (`animateStyle`) and a motion bound by `motion()` animate at
 * the same time, two kinds on one property: "opacity is animated by two sources: Snackbar and "pulse"". Called when `entry`
 * starts, whichever of the two starts first.
 */
export function checkSources(element: Element, entry: RunningStyle): void {
  if (reportedSources.has(element)) return;
  for (const other of running.get(element) ?? []) {
    if (other === entry || !other.cancel === !entry.cancel) continue;
    const property = other.properties.find(each => entry.properties.includes(each));
    if (property === undefined) continue;
    reportedSources.add(element);
    const [style, named] = entry.cancel ? [entry, other] : [other, entry];
    console.warn(
      `[@udixio/motion] ${property} is animated by two sources: ${style.source} and ${named.source}. While both run, the one that started last is seen: animate another property, or bind the motion on another element.`,
      element,
    );
    return;
  }
}
