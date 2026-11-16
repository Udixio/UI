import { flipFrames, sameBox, toLayoutBox, toVisualBox, type Box } from '../flip.js';
import { motionDisabledIn, motionScaleIn } from '../play.js';
import type { ContentPlan, Stretch } from '../project.js';
import { waapiProvider } from '../providers/waapi.js';
import type { MotionRuntime } from '../runtime.js';
import { anchorOf, holdAnchor, releaseAnchor } from './anchor.js';
import { playbackOf, restFrames, startContent, stopFlight } from './flight.js';
import { centredOn, contentPlanOf, depthOf, flyingChange, isNegligible, resizes, scalesMoving, stretchesCorners } from './plan.js';
import { contentOf, hasText, measure, measureWith, ownOf, radiiOf, referenceOf, unitOf, visualBoxOf } from './measure.js';
import { dispose, layoutScopeOf, relevant, scopeOf, scopes } from './scope.js';
import { SHARED_WINDOW } from '../shared-registry.js';
import type { Change, Item, PlannedMove, ReferenceRects, Scope } from './types.js';

/** A changed element whose content is planned in this flush: its content nodes go to `list`; `from` and `visual` are its visual boxes before and after. */
interface Host {
  from: Box;
  visual: Box;
  list: ContentPlan[];
  unit: Stretch;
  live: Map<HTMLElement, Box> | null;
}

export function scopeFor(root: HTMLElement): Scope {
  const existing = scopes.get(root);
  if (existing) return existing;
  const scope: Scope = {
    root,
    items: new Map(),
    observer: new MutationObserver(records => {
      const changes = records.filter(relevant);
      if (changes.length > 0) flush(scope, changes);
    }),
    resize: new ResizeObserver(() => refresh(scope, true)),
    onScroll: () => refresh(scope, false),
  };
  scope.observer.observe(root, { childList: true, subtree: true, attributes: true, characterData: true });
  scope.resize.observe(root);
  root.addEventListener('scroll', scope.onScroll, { capture: true, passive: true });
  scopes.set(root, scope);
  return scope;
}

/** An element that left the scope follows its new scope, without animating this time. */
function adopt(element: HTMLElement, item: Item): void {
  stopFlight(item);
  const scope = scopeFor(layoutScopeOf(element));
  scope.items.set(element, item);
  scopeOf.set(element, scope);
  measure(scope, element, item);
}

/** The followed elements that a mutation may have changed the content of: the nearest followed element containing each changed node. */
function dirtyItemsOf(scope: Scope, records: readonly MutationRecord[]): Set<Item> {
  const dirty = new Set<Item>();
  for (const record of records) {
    let node: Element | null = record.target instanceof Element ? record.target : record.target.parentElement;
    for (; node; node = node.parentElement) {
      const item = node instanceof HTMLElement ? scope.items.get(node) : undefined;
      if (item) {
        dirty.add(item);
        break;
      }
      if (node === scope.root) break;
    }
  }
  return dirty;
}

/** Whether an element is entering or leaving: its `data-presence` is not `present`, and its presence owns its transform. */
function isPresenceBusy(element: HTMLElement): boolean {
  const presence = element.getAttribute('data-presence');
  return presence !== null && presence !== 'present';
}

/**
 * Whether a gesture holds an element while it is dragged or reordered: its gesture moves it with its own spring, so the
 * layout keeps no box for it until the gesture lets go.
 */
function isHeld(element: HTMLElement): boolean {
  return element.getAttribute('data-gesture') === 'dragging';
}

/** Whether a box has no size: an element that is hidden, or not displayed. */
function isEmpty(box: Box): boolean {
  return box.w === 0 || box.h === 0;
}

/**
 * The box a shared identity was last seen at, in the frame of the reference of `element`, when `element` is visible and
 * the identity was held by another element that went away at most `SHARED_WINDOW` ms ago (reads only).
 */
function arrivalOf(scope: Scope, element: HTMLElement, key: string, runtime: MotionRuntime, rects: ReferenceRects): Box | undefined {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return undefined;
  const page = runtime.shared.recall(key, element, SHARED_WINDOW);
  if (!page) return undefined;
  const reference = referenceOf(scope, element);
  let origin = rects.get(reference);
  if (!origin) {
    origin = reference.getBoundingClientRect();
    rects.set(reference, origin);
  }
  const win = element.ownerDocument.defaultView;
  return {
    cx: page.left - (win?.scrollX ?? 0) + page.width / 2 - origin.left,
    cy: page.top - (win?.scrollY ?? 0) + page.height / 2 - origin.top,
    w: page.width,
    h: page.height,
  };
}

/**
 * Compare the layout with the cache, and play the difference of every element that moved.
 * Reads come first in each pass, and a pass never reads after its own writes: the browser then recalculates
 * the style at most once per flush, not once per element. `records` are the mutations that caused the flush.
 */
export function flush(scope: Scope, records: readonly MutationRecord[] = []): void {
  for (const [element, item] of [...scope.items]) {
    if (element.isConnected && !scope.root.contains(element)) {
      scope.items.delete(element);
      adopt(element, item);
    }
  }
  if (scope.items.size === 0) {
    dispose(scope);
    return;
  }
  // 1. Reads only, nothing is stopped: find the elements whose place really changed. An element at rest
  // needs its rect alone, since its visual box already includes its own transform. Only an element in
  // flight needs its style, to undo the animated transform. An element at rest whose content may have
  // changed gets its content measured again.
  const rects: ReferenceRects = new Map();
  const dirty = dirtyItemsOf(scope, records);
  const changed: Change[] = [];
  // The elements that enter or leave: their moves stop after this pass, which reads only.
  const busy: Item[] = [];
  // The elements that arrive in the place of a shared identity: each moves from the box its identity was last seen at.
  let morphs: Set<HTMLElement> | undefined;
  // An element whose parent is the root has the root as its reference: with none nested, the passes below that order or join followed elements do nothing.
  let nested = false;
  for (const [element, item] of scope.items) {
    if (!element.isConnected) continue;
    if (isPresenceBusy(element) || isHeld(element)) {
      // No box is kept for it: it is measured again at the first flush where it is present or released, without a move.
      busy.push(item);
      item.layout = undefined;
      item.visual = undefined;
      if (item.content.length > 0) item.content = [];
      continue;
    }
    // A keyed element at rest, with no visible box yet, may arrive in the place of its shared identity.
    if (item.shared !== undefined && item.handle === null && (!item.visual || isEmpty(item.visual))) {
      const from = arrivalOf(scope, element, item.shared, item.runtime, rects);
      if (from) {
        nested = true;
        (morphs ??= new Set()).add(element);
        changed.push([element, item, from, null, null]);
        continue;
      }
    }
    if (!item.layout || !item.visual) {
      nested = true;
      if (item.handle === null) measure(scope, element, item, rects);
      continue;
    }
    // A child animated as content moves with its projector: it is changed with it, in 1b.
    if (item.projector !== null) {
      nested = true;
      continue;
    }
    const reference = referenceOf(scope, element);
    if (reference !== scope.root) nested = true;
    const visualNow = visualBoxOf(scope, element, rects, reference);
    if (item.handle !== null) {
      // In flight: the underlying layout box, with the animated transform undone.
      const own = ownOf(element);
      if (sameBox(toLayoutBox(visualNow, own), item.layout)) continue; // its destination did not change: keep flying
      // A carried move keeps the velocity its spring has now, and starts its content from where it is now, both read before anything is cancelled.
      changed.push(flyingChange(element, item, item.layout, item.visual, own));
    } else if (sameBox(visualNow, item.visual)) {
      // It did not move, but its content may have changed.
      if (dirty.has(item)) item.content = contentOf(scope, element);
    } else {
      changed.push([element, item, item.visual, null, null]);
    }
  }
  // The moves of the elements that enter or leave stop here, before the writes below, whatever changed.
  for (const item of busy) stopFlight(item);
  // Nothing changed: no other move is stopped, planned or played.
  if (changed.length === 0) return;
  // 1b. A followed child of a changed element is changed too, moved or not: its reference may now carry it as content.
  // Its box is planned in pass 3, from the content its reference is running when that carries it; a child in flight
  // by itself starts as an element in flight does.
  if (nested) {
    const changing = new Set(changed.map(([element]) => element));
    for (let grew = true; grew; ) {
      grew = false;
      for (const [element, item] of scope.items) {
        if (changing.has(element) || !element.isConnected || !item.layout || !item.visual || !changing.has(referenceOf(scope, element))) continue;
        if (item.handle !== null && item.projector === null) changed.push(flyingChange(element, item, item.layout, item.visual, ownOf(element)));
        else changed.push([element, item, item.visual, null, null]);
        changing.add(element);
        grew = true;
      }
    }
  }
  // 2. Writes: stop only the moves whose destination changed, and the content that they carry.
  for (const [, item] of changed) stopFlight(item);
  // 3. Reads, after the writes above: measure the new rest state of the changed elements, one computed style
  // per element, from which the move's rest transform, disabled flag and scale are all taken. The content is
  // planned against the cache as it was before this measure. A reference is planned before the elements it
  // contains: a changed element whose reference has a content plan joins that content, and has no move of its own.
  const rectsAfterWrites: ReferenceRects = new Map();
  // Without a nested element, no changed element references another, and the order of the change is kept.
  const references = new Set(nested ? changed.map(([element]) => referenceOf(scope, element)) : []);
  const ordered = nested ? [...changed].sort((a, b) => depthOf(scope, a[0]) - depthOf(scope, b[0])) : changed;
  const hosts = new Map<HTMLElement, Host>();
  const nodes = new Map<HTMLElement, Item>(); // the followed elements that join a content plan, by element
  const planned: PlannedMove[] = [];
  for (const [element, item, from, velocity, live] of ordered) {
    const contentBefore = item.content;
    const style = getComputedStyle(element);
    const disabled = motionDisabledIn(style);
    const scale = motionScaleIn(style);
    const visual = measureWith(scope, element, item, style, rectsAfterWrites);
    // A morph plays its own move: it neither joins the content of its reference nor carries any content of its own.
    const morph = morphs !== undefined && morphs.has(element);
    const host = !morph && hosts.size > 0 ? hosts.get(referenceOf(scope, element)) : undefined;
    if (host) {
      // A node of the content of its reference: its own content hangs from it, and it is moved with the reference's content.
      const kind = hasText(element) ? 'text' : 'box';
      const node: ContentPlan = {
        element,
        kind,
        // Where it is on screen, when its reference's running content carries it; else its place at rest, in the reference's frame.
        before: host.live?.get(element) ?? centredOn(from, host.from),
        after: centredOn(visual, host.visual),
        rest: item.rest,
        radii: kind === 'box' ? radiiOf(style) : null,
        unit: host.unit,
        children: kind === 'box' ? contentPlanOf(contentBefore, item.content, element, host.live) : [],
      };
      host.list.push(node);
      nodes.set(element, item);
      if (kind === 'box') hosts.set(element, { from, visual, list: node.children, unit: unitOf(element, element.getBoundingClientRect()), live: host.live });
      continue;
    }
    // A move with a visible velocity still flies when its frames are null: the element is then at its destination.
    const carry = isNegligible(velocity) ? null : velocity;
    const frames = flipFrames(from, visual, item.rest) ?? (carry && restFrames(item.rest));
    if (!frames) continue;
    // Its content follows a move that resizes it, or a scale that the velocity still carries, even at the same size.
    // A reference with followed children has a content plan even without content of its own: the children are its content.
    const follows = resizes(frames) || scalesMoving(carry);
    const content = !morph && follows && (item.content.length > 0 || references.has(element)) ? contentPlanOf(contentBefore, item.content, element, live) : null;
    if (content) hosts.set(element, { from, visual, list: content, unit: unitOf(element, element.getBoundingClientRect()), live });
    // A move that changes the size of its element by more than 3 % keeps its px corner radii round.
    const radii = stretchesCorners(frames) ? radiiOf(style) : null;
    planned.push({ element, item, frames, velocity: carry, disabled, scale, content, radii, morph });
  }
  if (planned.length === 0) return;
  // The scroller that anchors the scope is read before the writes: its anchoring is held while each flight runs.
  const scroller = anchorOf(scope.root);
  // 4. Writes only: no style is read from here on. The scheme and the policy are read once, before the writes.
  const scheme = scope.root.ownerDocument.documentElement.dataset.motionScheme === 'standard' ? 'standard' : 'expressive';
  if (planned[0].item.runtime.policy.reduced) return;
  for (const move of planned) {
    const { element, item, disabled, scale } = move;
    if (disabled || scale === 0) continue;
    try {
      const playback = playbackOf(move, scheme);
      if (!playback || !Number.isFinite(playback.duration) || playback.duration <= 0) continue;
      const handle = waapiProvider.animate({ target: element, keyframes: playback.keyframes, timing: { duration: playback.duration, easing: playback.easing }, commit: false, styles: playback.styles ?? undefined });
      holdAnchor(scroller);
      item.handle = handle;
      item.flight = playback.flight;
      void handle.finished.then(() => {
        releaseAnchor(scroller);
        if (item.handle === handle) stopFlight(item);
      });
      startContent(item, move, playback, nodes);
    } catch (error) {
      if (item.development) console.error('[@udixio/motion] layout move could not animate:', error);
    }
  }
}

/**
 * The layout changed without a mutation (resize, scroll): update the cache now, animate nothing.
 * Synchronous on purpose: a ResizeObserver callback runs right after layout and a scroll event once per
 * frame, so a change made just after either is flushed against a fresh cache. The content is measured on a
 * resize only: a scroll moves the element, not the content relative to it.
 */
function refresh(scope: Scope, content: boolean): void {
  const rects: ReferenceRects = new Map();
  for (const [element, item] of scope.items) {
    // An element animated as content is measured with its projector, whose move it follows. An element entering or leaving, or held by a gesture, is
    // measured once present or released.
    if (!element.isConnected || item.projector !== null || isPresenceBusy(element) || isHeld(element)) continue;
    if (item.handle === null) {
      measure(scope, element, item, rects, content);
    } else {
      item.layout = toLayoutBox(visualBoxOf(scope, element, rects), ownOf(element));
      item.visual = toVisualBox(item.layout, item.rest);
    }
  }
}
