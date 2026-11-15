import { IGNORED_ATTRIBUTES, type Scope } from './types.js';

export const scopes = new WeakMap<HTMLElement, Scope>();
export const scopeOf = new WeakMap<HTMLElement, Scope>();

/** The watched ancestor of a followed element: closest `[data-motion-scope]`, else its parent. */
export function layoutScopeOf(target: HTMLElement): HTMLElement {
  return target.parentElement?.closest<HTMLElement>('[data-motion-scope]') ?? target.parentElement ?? target;
}

export function relevant(record: MutationRecord): boolean {
  return record.type === 'childList' || record.type === 'characterData' || !IGNORED_ATTRIBUTES.has(record.attributeName ?? '');
}

export function dispose(scope: Scope): void {
  scope.observer.disconnect();
  scope.resize.disconnect();
  scope.root.removeEventListener('scroll', scope.onScroll, { capture: true });
  scopes.delete(scope.root);
}
