// The public entry `@udixio/motion/scope`: the teardown of a section of the page and the report of its motions. The main
// entry holds neither; importing this entry is what loads them, and in development it exposes `inspect` on the page.
import { getMotions, nameOf, type MotionBinding } from './bind.js';
import { definedMotions, type MotionKind, type MotionSpec } from './define-motion.js';
import { stopScanning } from './connect.js';
import { gesturesModule, sequencesModule, valuesModule } from './feature-loader.js';

/** A plain report of the motions under a root, for development. */
export interface MotionInspection {
  /** Whether motion is reduced, and what reduces it: the `data-motion-policy` attribute, the system setting, or nothing. */
  readonly policy: { readonly reduced: boolean; readonly source: 'document' | 'system' | 'none' };
  /** Each binding under the root, the root included. */
  readonly bindings: readonly MotionInspectionBinding[];
  /** The names of the defined motions, in definition order. */
  readonly definitions: readonly string[];
}

/** One binding under the root: the element it is on, as a short CSS path, and its state. */
export interface MotionInspectionBinding {
  /** The element, as a short CSS path. */
  readonly element: string;
  /** A motion kind, or `value`, `gesture` or `sequence`. */
  readonly kind: MotionKind | 'value' | 'gesture' | 'sequence';
  /** The name the binding was made from, or null when it was made from a raw definition. */
  readonly name: string | null;
  /** The verb of a motion; null for a value, a gesture or a sequence. */
  readonly verb: MotionSpec['verb'] | null;
  /** `present` or `absent` for a presence, `playing` or `paused` for a loop, `playing` or `idle` for another motion or a sequence, `bound` for a value or a gesture. */
  readonly state: 'present' | 'absent' | 'playing' | 'idle' | 'paused' | 'bound';
}

/** Whether a handle is still within its motion: its time has not reached its end. */
function playing(handle: { readonly currentTime: number; readonly delay: number; readonly duration: number } | null): boolean {
  return handle !== null && handle.currentTime < handle.delay + handle.duration;
}

function stateOf(binding: MotionBinding): MotionInspectionBinding['state'] {
  if (binding.kind === 'presence' || binding.verb === 'reveal') return binding.present ? 'present' : 'absent';
  if (binding.kind === 'loop') return binding.paused ? 'paused' : 'playing';
  return playing(binding.handle) ? 'playing' : 'idle';
}

/** A short CSS path to an element: from the nearest ancestor with an id, else from the root, by position among siblings. */
function pathOf(el: Element): string {
  const parts: string[] = [];
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (node.id) {
      parts.unshift(`${node.localName}#${node.id}`);
      break;
    }
    const parent = node.parentElement;
    parts.unshift(parent ? `${node.localName}:nth-child(${[...parent.children].indexOf(node) + 1})` : node.localName);
  }
  return parts.join(' > ');
}

/** The root and every element under it, the root first. */
function elementsUnder(root: Element): Element[] {
  return [root, ...root.querySelectorAll('*')];
}

/** The reduced-motion policy the page applies: `<html data-motion-policy="reduce">` (the document), else the system setting. */
function policyOf(): MotionInspection['policy'] {
  const attribute = document.documentElement.dataset.motionPolicy === 'reduce';
  const system = !attribute && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { reduced: attribute || system, source: attribute ? 'document' : system ? 'system' : 'none' };
}

/**
 * Destroy every motion binding under `root` and its descendants (presence, emphasis, layout, reveal, scrub, loop, values,
 * gestures and sequences). Each element is left in its stylesheet state: inline values, `data-motion-presence` and `inert` are
 * released. The connections of the page that cover `root` stop observing it; a connection made afterwards binds it again.
 * @param root - The subtree whose motions are destroyed, the root included.
 */
export function revert(root: Element = document.documentElement): void {
  stopScanning(root);
  for (const el of elementsUnder(root)) {
    for (const binding of getMotions(el)) binding.destroy();
    for (const binding of valuesModule()?.valuesOf(el) ?? []) binding.destroy();
    gesturesModule()?.getGesture(el)?.destroy();
    sequencesModule()?.getSequence(el)?.destroy();
  }
}

/**
 * A plain, serialisable report of the motions under `root` (for development): the reduced-motion policy, each binding with
 * its element, kind, name, verb and state, and the defined motions. It changes nothing on the page.
 * @param root - The subtree to report; the root is included.
 * @returns A plain report: the policy, each binding, the defined motions.
 */
export function inspect(root: Element = document.documentElement): MotionInspection {
  const bindings: MotionInspectionBinding[] = [];
  for (const el of elementsUnder(root)) {
    const element = pathOf(el);
    for (const binding of getMotions(el)) {
      bindings.push({ element, kind: binding.kind, name: nameOf(binding) ?? null, verb: binding.verb, state: stateOf(binding) });
    }
    for (const binding of valuesModule()?.valuesOf(el) ?? []) bindings.push({ element, kind: 'value', name: binding.name, verb: null, state: 'bound' });
    const gesture = gesturesModule()?.getGesture(el);
    if (gesture) bindings.push({ element, kind: 'gesture', name: gesture.name, verb: null, state: 'bound' });
    const sequence = sequencesModule()?.getSequence(el);
    if (sequence) bindings.push({ element, kind: 'sequence', name: null, verb: null, state: playing(sequence.handle) ? 'playing' : 'idle' });
  }
  return { policy: policyOf(), bindings, definitions: [...definedMotions()] };
}

// In development, `inspect` is also on the page, as `udixio.motion.inspect()`.
if (__MOTION_CHECKS__) {
  const host = globalThis as unknown as { udixio?: { motion?: { inspect?: typeof inspect } } };
  host.udixio ??= {};
  host.udixio.motion ??= {};
  host.udixio.motion.inspect = inspect;
}
