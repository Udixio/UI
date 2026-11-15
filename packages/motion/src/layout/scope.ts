import { layoutScopeOf } from '../scope-of.js';
import { IGNORED_ATTRIBUTES, type Scope } from './types.js';

export { layoutScopeOf };

export const scopes = new WeakMap<HTMLElement, Scope>();
export const scopeOf = new WeakMap<HTMLElement, Scope>();

/** A `hidden` change on an element that carries a presence is not relevant: its presence announces its own exit and entry to the layout. */
export function relevant(record: MutationRecord): boolean {
  if (record.type === 'childList' || record.type === 'characterData') return true;
  if (record.attributeName === 'hidden' && record.target instanceof Element && record.target.hasAttribute('data-presence')) return false;
  return !IGNORED_ATTRIBUTES.has(record.attributeName ?? '');
}

export function dispose(scope: Scope): void {
  scope.observer.disconnect();
  scope.resize.disconnect();
  scope.root.removeEventListener('scroll', scope.onScroll, { capture: true });
  scopes.delete(scope.root);
}
