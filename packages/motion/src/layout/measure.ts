import { parseOwnTransform, toLayoutBox, type Box, type OwnTransform } from '../flip.js';
import { parseRadii, type Radii, type Stretch } from '../project.js';
import { CONTENT_BUDGET, CONTENT_DEPTH, type ContentNode, type Item, type ReferenceRects, type Scope } from './types.js';

export function ownOf(element: HTMLElement): OwnTransform {
  const style = getComputedStyle(element);
  return parseOwnTransform(style.translate, style.scale);
}

/** The `border-radius` of an element with no radius: the shorthand reads `0px` in each engine, and `''` where it is not serialised. */
const NO_RADIUS = new Set(['', '0px']);

/**
 * The px corner radii of an element, from the computed style its caller has read; null when none is kept round. The
 * shorthand is read first: an element without a radius, the common case, costs that one read instead of four.
 */
export function radiiOf(style: CSSStyleDeclaration): Radii | null {
  if (NO_RADIUS.has(style.borderRadius)) return null;
  return parseRadii(style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius);
}

/** Screen pixels per local pixel inside `element`, per axis: its rect against its layout size. */
export function unitOf(element: HTMLElement, rect: DOMRect): Stretch {
  return {
    x: element.offsetWidth ? rect.width / element.offsetWidth : 1,
    y: element.offsetHeight ? rect.height / element.offsetHeight : 1,
  };
}

/** The nearest followed ancestor inside the scope, else the scope root. */
export function referenceOf(scope: Scope, element: HTMLElement): HTMLElement {
  for (let parent = element.parentElement; parent && parent !== scope.root; parent = parent.parentElement) {
    if (scope.items.has(parent)) return parent;
  }
  return scope.root;
}

export function visualBoxOf(scope: Scope, element: HTMLElement, rects: ReferenceRects, reference = referenceOf(scope, element)): Box {
  const r = element.getBoundingClientRect();
  let o = rects.get(reference);
  if (!o) {
    o = reference.getBoundingClientRect();
    rects.set(reference, o);
  }
  return { cx: r.left + r.width / 2 - o.left, cy: r.top + r.height / 2 - o.top, w: r.width, h: r.height };
}

/** Whether an element has a direct text node with something other than whitespace. */
export function hasText(element: HTMLElement): boolean {
  return Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '');
}

/**
 * The content nodes under `parent`, in DOM order (reads only). A followed element is not content, nor is an
 * element with no size. A box's children are measured down to `CONTENT_DEPTH`; the budget is shared by the whole tree.
 */
function measureContent(scope: Scope, parent: HTMLElement, parentRect: DOMRect, depth: number, budget: { left: number }): ContentNode[] {
  const nodes: ContentNode[] = [];
  for (const child of Array.from(parent.children)) {
    if (budget.left <= 0) break;
    if (!(child instanceof HTMLElement) || scope.items.has(child)) continue;
    const r = child.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    budget.left--;
    const kind = hasText(child) ? 'text' : 'box';
    nodes.push({
      element: child,
      kind,
      box: {
        cx: r.left + r.width / 2 - (parentRect.left + parentRect.width / 2),
        cy: r.top + r.height / 2 - (parentRect.top + parentRect.height / 2),
        w: r.width,
        h: r.height,
      },
      children: kind === 'box' && depth < CONTENT_DEPTH ? measureContent(scope, child, r, depth + 1, budget) : [],
    });
  }
  return nodes;
}

/** The content of an element with no element child: nothing to measure, shared so that none is allocated. */
const NO_CONTENT: readonly ContentNode[] = Object.freeze([] as ContentNode[]);

/** The content tree of an element at rest (reads only). */
export function contentOf(scope: Scope, element: HTMLElement): readonly ContentNode[] {
  if (element.firstElementChild === null) return NO_CONTENT;
  return measureContent(scope, element, element.getBoundingClientRect(), 1, { left: CONTENT_BUDGET });
}

/** Measure an element at rest, from the computed style its caller has just read. Returns its visual box. */
export function measureWith(scope: Scope, element: HTMLElement, item: Item, style: CSSStyleDeclaration, rects: ReferenceRects, content = true): Box {
  item.rest = parseOwnTransform(style.translate, style.scale);
  const visual = visualBoxOf(scope, element, rects);
  item.visual = visual;
  item.layout = toLayoutBox(visual, item.rest);
  if (content) item.content = contentOf(scope, element);
  return visual;
}

/** Measure an element at rest. Its content is measured too, unless `content` is false. */
export function measure(scope: Scope, element: HTMLElement, item: Item, rects: ReferenceRects = new Map(), content = true): void {
  measureWith(scope, element, item, getComputedStyle(element), rects, content);
}
