/**
 * The Reduce motion choice of the documentation site. The visitor's choice is kept in `localStorage` and written on
 * `<html>` as `data-motion-policy="reduce"`, the attribute the motion runtime reads: the whole site then runs reduced
 * motion. Plain functions, shared by the rail's Reduce motion button and the Animation switches. The layout applies
 * the stored choice before the first paint.
 */

/** The stored choice: `reduce` when the visitor asked for reduced motion on this site, absent otherwise. */
export const MOTION_POLICY_STORAGE_KEY = 'udixio:docs:motion-policy';

const POLICY_ATTRIBUTE = 'data-motion-policy';
const SYSTEM_QUERY = '(prefers-reduced-motion: reduce)';

/** The visitor's choice. Storage that cannot be read counts as no choice. */
export function readStoredMotionPolicy(): boolean {
  try {
    return window.localStorage.getItem(MOTION_POLICY_STORAGE_KEY) === 'reduce';
  } catch {
    return false;
  }
}

function writeStoredMotionPolicy(reduce: boolean): void {
  try {
    if (reduce) window.localStorage.setItem(MOTION_POLICY_STORAGE_KEY, 'reduce');
    else window.localStorage.removeItem(MOTION_POLICY_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in privacy-restricted browser contexts: the choice then lasts for the page.
  }
}

/** Writes the policy on `<html>`: `data-motion-policy="reduce"`, or no attribute, which leaves the system in charge. */
export function applyMotionPolicy(reduce: boolean): void {
  if (reduce) document.documentElement.setAttribute(POLICY_ATTRIBUTE, 'reduce');
  else document.documentElement.removeAttribute(POLICY_ATTRIBUTE);
}

/** Chooses the policy of the site: kept for the next pages and visits, and written on `<html>` now. */
export function setMotionPolicy(reduce: boolean): void {
  writeStoredMotionPolicy(reduce);
  applyMotionPolicy(reduce);
}

/**
 * Calls `listener` now, and each time the policy on `<html>` changes, whoever writes it: another control, or the router
 * putting the choice back. Returns the function that stops the watch.
 */
export function watchMotionPolicy(listener: (reduce: boolean) => void): () => void {
  const root = document.documentElement;
  const sync = () => listener(root.getAttribute(POLICY_ATTRIBUTE) === 'reduce');
  const observer = new MutationObserver(sync);
  observer.observe(root, { attributes: true, attributeFilter: [POLICY_ATTRIBUTE] });
  sync();
  return () => observer.disconnect();
}

/**
 * Calls `listener` now, and each time the system's reduced-motion setting changes. Returns the function that stops the
 * watch.
 */
export function watchSystemReducedMotion(listener: (system: boolean) => void): () => void {
  const query = window.matchMedia(SYSTEM_QUERY);
  const sync = () => listener(query.matches);
  query.addEventListener('change', sync);
  sync();
  return () => query.removeEventListener('change', sync);
}

// The client router replaces the attributes of <html> on each navigation, so the stored choice is put back there.
// This module stays loaded for the rest of the visit, so the choice holds on every page after the first change.
if (typeof document !== 'undefined') {
  document.addEventListener('astro:after-swap', () => applyMotionPolicy(readStoredMotionPolicy()));
}
