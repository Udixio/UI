import type { VisualFrame } from '../contract.js';
import { parseOwnTransform, toVisualBox, type Box, type OwnTransform } from '../flip.js';
import { isStretched, liveContentBoxes, type ContentPlan, type Stretch } from '../project.js';
import { velocityOf } from './flight.js';
import { ownOf, radiiOf, referenceOf, unitOf } from './measure.js';
import type { Change, ContentNode, Item, Scope, Velocity } from './types.js';

/** Whether a velocity is too small to be seen: under 1 px/s, or 0.01 scale per second. No velocity is negligible. */
export function isNegligible(velocity: Velocity | null): boolean {
  return velocity === null || (Math.abs(velocity.x) < 1 && Math.abs(velocity.y) < 1 && Math.abs(velocity.scaleX) < 0.01 && Math.abs(velocity.scaleY) < 0.01);
}

/** Whether a move changes the size of its element: a scale ratio off one by more than 1 %, on one axis at least. */
export function resizes([from, to]: [VisualFrame, VisualFrame]): boolean {
  return Math.abs((from.scaleX ?? 1) / (to.scaleX ?? 1) - 1) > 0.01 || Math.abs((from.scaleY ?? 1) / (to.scaleY ?? 1) - 1) > 0.01;
}

/** Whether a move changes the size of its element by more than 3 % on one axis: its px corner radii are then kept round. */
export function stretchesCorners([from, to]: [VisualFrame, VisualFrame]): boolean {
  return isStretched({ x: (from.scaleX ?? 1) / (to.scaleX ?? 1), y: (from.scaleY ?? 1) / (to.scaleY ?? 1) });
}

/** Whether a carried velocity moves the scale of its element, which a content plan must then follow. */
export function scalesMoving(velocity: Velocity | null): boolean {
  return velocity !== null && (Math.abs(velocity.scaleX) >= 0.01 || Math.abs(velocity.scaleY) >= 0.01);
}

/** Where the content of a running move is now, when a carried move starts from it: null when there is no running content. */
function liveBoxesOf(item: Item, own: OwnTransform): Map<HTMLElement, Box> | null {
  if (item.contentPlan.length === 0) return null;
  return liveContentBoxes(item.contentPlan, { x: own.sx / item.rest.sx, y: own.sy / item.rest.sy }, ownOf);
}

/**
 * The plan of the content of a resizing element (reads only): each node's box before the move, from the live boxes
 * of a carried move when there are some and else from the cache, and after it; its rest transform; and the unit of its parent.
 */
export function contentPlanOf(cache: readonly ContentNode[], after: readonly ContentNode[], parent: HTMLElement, live: Map<HTMLElement, Box> | null): ContentPlan[] {
  const previous = new Map<HTMLElement, Box>();
  const flatten = (nodes: readonly ContentNode[]): void => {
    for (const node of nodes) {
      previous.set(node.element, node.box);
      flatten(node.children);
    }
  };
  flatten(cache);
  for (const [element, box] of live ?? []) previous.set(element, box);
  const plan = (nodes: readonly ContentNode[], unit: Stretch): ContentPlan[] =>
    nodes.map(node => {
      // One computed style per node: its rest transform, and for a box its corner radii.
      const style = getComputedStyle(node.element);
      return {
        element: node.element,
        kind: node.kind,
        before: previous.get(node.element) ?? node.box,
        after: node.box,
        rest: parseOwnTransform(style.translate, style.scale),
        radii: node.kind === 'box' ? radiiOf(style) : null,
        unit,
        children: node.children.length > 0 ? plan(node.children, unitOf(node.element, node.element.getBoundingClientRect())) : [],
      };
    });
  return plan(after, unitOf(parent, parent.getBoundingClientRect()));
}

/** How many followed elements of the scope contain `element`: a reference always has a smaller depth than what it contains. */
export function depthOf(scope: Scope, element: HTMLElement): number {
  let depth = 0;
  for (let reference = referenceOf(scope, element); reference !== scope.root; reference = referenceOf(scope, reference)) depth++;
  return depth;
}

/** A box given relative to the top-left corner of its reference, made relative to the centre of that reference. */
export function centredOn(box: Box, reference: Box): Box {
  return { cx: box.cx - reference.w / 2, cy: box.cy - reference.h / 2, w: box.w, h: box.h };
}

/** The change of an element in flight (reads only): a carried move starts from its layout box as it is now, with the velocity and content it carries; otherwise from its rest visual box. */
export function flyingChange(element: HTMLElement, item: Item, layout: Box, visual: Box, own: OwnTransform): Change {
  const carried = (item.spec.interrupt ?? 'carry') === 'carry';
  return carried ? [element, item, toVisualBox(layout, own), velocityOf(item), liveBoxesOf(item, own)] : [element, item, visual, null, null];
}
