/**
 * The behaviour of the API reference page (/motion/api), in the browser:
 *
 * - The framework the reader chose ("Written for", `<html data-docs-framework>`) brings its blocks first: each
 *   `[data-api-order]` holds blocks marked `data-api-framework` (react, angular, svelte, html, or core, the shared
 *   @udixio/motion), and they are put in the order: the chosen framework, the core, then the other frameworks. The page
 *   orders each container as the parser reaches it (an inline script, before the first paint), and again on each change.
 * - An anchor to an entry (`#api-motion`) opens it, on load, on `hashchange` and on a click of a link to it; if the
 *   filter hides it, the filter is cleared first. Opening an entry by its summary writes its anchor in the address, so the
 *   address can be copied to share it.
 *
 * It imports nothing: the filter (ApiFilter.tsx) imports the event name from here.
 */

/** Dispatched on `document` to clear the filter (ApiFilter listens). */
export const API_FILTER_CLEAR = 'udx-api-filter-clear';

/** The frameworks, in the order the server renders their blocks after the core. */
export const API_FRAMEWORK_ORDER = ['react', 'angular', 'svelte', 'html'];

/** The rank of a block: the chosen framework, then the core, then the others in their usual order. */
const rankOf = (block: Element, chosen: string) => {
  const key = (block as HTMLElement).dataset.apiFramework ?? 'core';
  if (key === chosen) return 0;
  if (key === 'core') return 1;
  return 2 + API_FRAMEWORK_ORDER.indexOf(key);
};

/** Orders the blocks of one container (a stable sort: the groups of the core keep their order). */
export function orderBlocks(container: Element, chosen = document.documentElement.dataset.docsFramework ?? 'react'): void {
  const children = [...container.children];
  const sorted = [...children].sort((a, b) => rankOf(a, chosen) - rankOf(b, chosen));
  if (sorted.some((block, index) => block !== children[index])) container.append(...sorted);
}

const orderAll = () => document.querySelectorAll('[data-api-order]').forEach((container) => orderBlocks(container));

/** Opens the entry `id` names, shown even if the filter hid it. Returns whether `id` is an entry. */
function openEntry(id: string): HTMLDetailsElement | null {
  const target = id ? document.getElementById(id) : null;
  if (!(target instanceof HTMLDetailsElement) || !target.hasAttribute('data-api-entry')) return null;
  if (target.hidden) {
    // Shown at once, so that the browser can scroll to it; the filter then clears and shows everything else.
    for (let element: HTMLElement | null = target; element; element = element.parentElement) element.hidden = false;
    document.dispatchEvent(new CustomEvent(API_FILTER_CLEAR));  }
  target.open = true;
  return target;
}

const idOf = (hash: string) => {
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
};

const openFromAddress = () => openEntry(idOf(location.hash))?.scrollIntoView({ block: 'start' });

let connected = false;

/** Wires the page; called on each `astro:page-load`, it connects the window once and opens the entry of the address. */
export function connectApiPage(): void {
  orderAll();
  if (!document.querySelector('[data-api-entry]')) return;
  openFromAddress();
  if (connected) return;
  connected = true;
  new MutationObserver(() => {
    if (document.querySelector('[data-api-order]')) orderAll();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-docs-framework'] });
  window.addEventListener('hashchange', () => {
    if (document.querySelector('[data-api-entry]')) openFromAddress();
  });
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element) || !document.querySelector('[data-api-entry]')) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
    // A link to an entry opens it before the browser scrolls to it.
    if (link) {
      openEntry(idOf(link.hash));
      return;
    }
    const summary = event.target.closest('details[data-api-entry] > summary');
    if (!summary) return;
    const entry = summary.parentElement as HTMLDetailsElement;
    // After the toggle: an entry the reader opens puts its anchor in the address.
    requestAnimationFrame(() => {
      if (entry.open && location.hash !== `#${entry.id}`) history.replaceState(history.state, '', `#${entry.id}`);
    });
  });
}
