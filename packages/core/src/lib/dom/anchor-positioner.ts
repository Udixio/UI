import type { AnchorPosition } from '../interfaces/anchor-positioner.interface.js';

export interface AnchorPositionerOptions {
  /** The element the floating element is positioned relative to. */
  anchor: HTMLElement;
  /** The floating element being positioned. The adapter owns portaling it. */
  floating: HTMLElement;
  position?: () => AnchorPosition;
  /**
   * Whether `floating` mirrors the theme scope of its anchor. Adapters portal
   * the floating element to the document body, out of any `.light`/`.dark`/
   * `.theme-*` ancestor the anchor sits in; mirroring those classes keeps a
   * tooltip opened from a light island light on a dark page. On by default.
   */
  inheritThemeScope?: boolean;
}

export interface AnchorPositionerController {
  /** Recomputes placement, for example after `position` changes. */
  update(): void;
  destroy(): void;
}

let nextAnchorId = 0;

/**
 * The classes the Tailwind plugin uses as theme boundaries: a colour scheme
 * (`light`/`dark`), the dynamic root (`dynamic`), and a derived theme
 * (`theme-{name}`). One of each kind is mirrored, the nearest to the anchor.
 */
const isSchemeClass = (name: string) => name === 'light' || name === 'dark';
const isDynamicClass = (name: string) => name === 'dynamic';
const isSubThemeClass = (name: string) => name.startsWith('theme-');

/**
 * Copies the anchor's enclosing theme classes onto `floating`, so a portaled
 * surface resolves the same theme variables as the element it belongs to.
 * Scopes set on `body` or `html` are skipped: the floating element already
 * lives under them and inherits them live, whereas a copy would freeze the
 * scheme at the moment the controller was created and miss a later toggle.
 * The islands actually mirrored are observed so a class change on them is
 * mirrored again. Returns a function that removes what was added.
 */
export function mirrorThemeScope(
  anchor: HTMLElement,
  floating: HTMLElement,
): () => void {
  const root = anchor.ownerDocument.documentElement;
  const body = anchor.ownerDocument.body;
  let added: string[] = [];
  const scopes = new Set<HTMLElement>();

  const collect = () => {
    let scheme: string | undefined;
    let dynamic: string | undefined;
    let subTheme: string | undefined;
    scopes.clear();
    for (
      let current: HTMLElement | null = anchor;
      current && current !== body && current !== root;
      current = current.parentElement
    ) {
      for (const name of Array.from(current.classList)) {
        if (!scheme && isSchemeClass(name)) scheme = name;
        else if (!dynamic && isDynamicClass(name)) dynamic = name;
        else if (!subTheme && isSubThemeClass(name)) subTheme = name;
        else continue;
        scopes.add(current);
      }
      if (scheme && dynamic && subTheme) break;
    }
    return [scheme, dynamic, subTheme].filter((name): name is string => !!name);
  };

  const apply = () => {
    const next = collect().filter(
      (name) => added.includes(name) || !floating.classList.contains(name),
    );
    floating.classList.remove(...added.filter((name) => !next.includes(name)));
    floating.classList.add(...next);
    added = next;
  };

  apply();
  const observer =
    typeof MutationObserver === 'function'
      ? new MutationObserver(apply)
      : undefined;
  scopes.forEach((scope) =>
    observer?.observe(scope, { attributes: true, attributeFilter: ['class'] }),
  );

  return () => {
    observer?.disconnect();
    floating.classList.remove(...added);
    added = [];
  };
}

function supportsCssAnchorPositioning(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('anchor-name', '--udx-anchor-probe')
  );
}

/**
 * Resolves the nearest box-generating element starting at `element`. Every
 * interactive Udixio component (`Button`, `IconButton`, `Chip`, ...) hosts
 * itself with `display: contents`, which generates no box of its own:
 * `anchor-name` set on it anchors nothing, and its `getBoundingClientRect()`
 * is always `(0, 0, 0, 0)`. Positioning needs a real box, so this walks into
 * the first element child until it finds one that generates one.
 *
 * Shared by everything that attaches to a host it does not own -- the anchor
 * positioner and the badge -- so an adapter directive never has to know how a
 * given component hosts itself.
 */
export function resolveBoxElement(element: HTMLElement): HTMLElement {
  let current: Element = element;
  while (getComputedStyle(current).display === 'contents') {
    const child = current.firstElementChild;
    if (!child) break;
    current = child;
  }
  return current as HTMLElement;
}

/**
 * `position-area` keyword pairs for each `AnchorPosition`. Per the CSS
 * Anchor Positioning spec these are space-separated keywords (`"top left"`),
 * not the hyphenated `AnchorPosition` identifier itself -- passing the
 * hyphenated form straight through is an invalid custom-ident that browsers
 * silently ignore.
 */
export const POSITION_AREA: Record<AnchorPosition, string> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  'top-left': 'top left',
  'top-right': 'top right',
  'bottom-left': 'bottom left',
  'bottom-right': 'bottom right',
};

/**
 * Connects the shared floating-position effect for `AnchorPositioner`. Uses
 * native CSS Anchor Positioning when the browser supports it (`anchor-name`
 * + `position-anchor` + `position-area`, with `flip-block`/`flip-inline`
 * fallbacks); otherwise falls back to tracking the anchor's
 * `getBoundingClientRect()` on scroll/resize and positioning `floating` with
 * `position: fixed`. Both React and Angular adapters connect this single
 * controller and only own portaling `floating` into the DOM and its mount
 * lifecycle.
 */
export function createAnchorPositionerController({
  anchor: givenAnchor,
  floating,
  position = () => 'bottom',
  inheritThemeScope = true,
}: AnchorPositionerOptions): AnchorPositionerController {
  let destroyed = false;
  const anchor = resolveBoxElement(givenAnchor);
  const unmirrorThemeScope = inheritThemeScope
    ? mirrorThemeScope(givenAnchor, floating)
    : () => {};

  if (supportsCssAnchorPositioning()) {
    const anchorName = `--udx-anchor-${nextAnchorId++}`;
    anchor.style.setProperty('anchor-name', anchorName);
    floating.style.position = 'fixed';
    floating.style.margin = '0';
    floating.style.setProperty('position-anchor', anchorName);
    floating.style.setProperty(
      'position-try-fallbacks',
      'flip-block, flip-inline',
    );

    const update = () => {
      floating.style.setProperty('position-area', POSITION_AREA[position()]);
    };
    update();

    return {
      update,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        unmirrorThemeScope();
        anchor.style.removeProperty('anchor-name');
        floating.style.removeProperty('position-anchor');
        floating.style.removeProperty('position-area');
        floating.style.removeProperty('position-try-fallbacks');
      },
    };
  }

  const ownerWindow = anchor.ownerDocument.defaultView ?? globalThis.window;

  const update = () => {
    const rect = anchor.getBoundingClientRect();
    // `innerWidth`/`innerHeight` include the scrollbars, while CSS `right` and
    // `bottom` resolve against the layout viewport, which does not. Measuring
    // with the window would offset every left- and top-anchored placement by
    // the scrollbar width.
    const root = anchor.ownerDocument.documentElement;
    const viewportWidth = root.clientWidth || ownerWindow.innerWidth;
    const viewportHeight = root.clientHeight || ownerWindow.innerHeight;
    floating.style.position = 'fixed';
    floating.style.margin = '0';
    floating.style.top = '';
    floating.style.bottom = '';
    floating.style.left = '';
    floating.style.right = '';
    floating.style.transform = '';

    switch (position()) {
      case 'top':
        floating.style.bottom = `${viewportHeight - rect.top}px`;
        floating.style.left = `${rect.left + rect.width / 2}px`;
        floating.style.transform = 'translateX(-50%)';
        break;
      // The four corner positions name a cell of the 3x3 grid around the
      // anchor: outside its box on BOTH axes, matching how the native
      // `position-area: top left` keyword pair resolves. Anchoring one of
      // these to an anchor edge instead would place the element differently
      // depending on whether the browser supports Anchor Positioning.
      case 'top-left':
        floating.style.bottom = `${viewportHeight - rect.top}px`;
        floating.style.right = `${viewportWidth - rect.left}px`;
        break;
      case 'top-right':
        floating.style.bottom = `${viewportHeight - rect.top}px`;
        floating.style.left = `${rect.right}px`;
        break;
      case 'bottom':
        floating.style.top = `${rect.bottom}px`;
        floating.style.left = `${rect.left + rect.width / 2}px`;
        floating.style.transform = 'translateX(-50%)';
        break;
      case 'bottom-left':
        floating.style.top = `${rect.bottom}px`;
        floating.style.right = `${viewportWidth - rect.left}px`;
        break;
      case 'bottom-right':
        floating.style.top = `${rect.bottom}px`;
        floating.style.left = `${rect.right}px`;
        break;
      case 'left':
        floating.style.right = `${viewportWidth - rect.left}px`;
        floating.style.top = `${rect.top + rect.height / 2}px`;
        floating.style.transform = 'translateY(-50%)';
        break;
      case 'right':
        floating.style.left = `${rect.right}px`;
        floating.style.top = `${rect.top + rect.height / 2}px`;
        floating.style.transform = 'translateY(-50%)';
        break;
    }
  };
  update();

  const resizeObserver = new ResizeObserver(update);
  resizeObserver.observe(anchor);
  ownerWindow.addEventListener('scroll', update, true);
  ownerWindow.addEventListener('resize', update);

  return {
    update,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      unmirrorThemeScope();
      resizeObserver.disconnect();
      ownerWindow.removeEventListener('scroll', update, true);
      ownerWindow.removeEventListener('resize', update);
    },
  };
}
