import type { AnchorPosition } from '../interfaces/anchor-positioner.interface.js';

export interface AnchorPositionerOptions {
  /** The element the floating element is positioned relative to. */
  anchor: HTMLElement;
  /** The floating element being positioned. The adapter owns portaling it. */
  floating: HTMLElement;
  position?: () => AnchorPosition;
}

export interface AnchorPositionerController {
  /** Recomputes placement, for example after `position` changes. */
  update(): void;
  destroy(): void;
}

let nextAnchorId = 0;

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
 */
function resolveBoxElement(element: HTMLElement): HTMLElement {
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
const POSITION_AREA: Record<AnchorPosition, string> = {
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
}: AnchorPositionerOptions): AnchorPositionerController {
  let destroyed = false;
  const anchor = resolveBoxElement(givenAnchor);

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
    floating.style.position = 'fixed';
    floating.style.margin = '0';
    floating.style.top = '';
    floating.style.bottom = '';
    floating.style.left = '';
    floating.style.right = '';
    floating.style.transform = '';

    switch (position()) {
      case 'top':
        floating.style.bottom = `${ownerWindow.innerHeight - rect.top}px`;
        floating.style.left = `${rect.left + rect.width / 2}px`;
        floating.style.transform = 'translateX(-50%)';
        break;
      case 'top-left':
        floating.style.bottom = `${ownerWindow.innerHeight - rect.top}px`;
        floating.style.left = `${rect.left}px`;
        break;
      case 'top-right':
        floating.style.bottom = `${ownerWindow.innerHeight - rect.top}px`;
        floating.style.right = `${ownerWindow.innerWidth - rect.right}px`;
        break;
      case 'bottom':
        floating.style.top = `${rect.bottom}px`;
        floating.style.left = `${rect.left + rect.width / 2}px`;
        floating.style.transform = 'translateX(-50%)';
        break;
      case 'bottom-left':
        floating.style.top = `${rect.bottom}px`;
        floating.style.left = `${rect.left}px`;
        break;
      case 'bottom-right':
        floating.style.top = `${rect.bottom}px`;
        floating.style.right = `${ownerWindow.innerWidth - rect.right}px`;
        break;
      case 'left':
        floating.style.right = `${ownerWindow.innerWidth - rect.left}px`;
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
      resizeObserver.disconnect();
      ownerWindow.removeEventListener('scroll', update, true);
      ownerWindow.removeEventListener('resize', update);
    },
  };
}
