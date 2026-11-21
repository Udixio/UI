import { expect, it } from 'vitest';
import { createSharedRegistry } from './shared-registry.js';

it('promotes the first eligible registration in token order, including repeated elements', () => {
  const registry = createSharedRegistry(document, false);
  const a = document.createElement('div');
  const b = document.createElement('div');
  document.body.append(a, b);
  try {
    const removeA = registry.register('card', a);
    registry.register('card', b);
    const removeA2 = registry.register('card', a);
    expect(registry.resolve('card')).toBe(a);
    removeA(); removeA();
    expect(registry.resolve('card')).toBe(b);
    b.dataset.motionPresence = 'exiting';
    expect(registry.resolve('card')).toBe(a);
    a.remove();
    expect(registry.resolve('card')).toBeUndefined();
    document.body.append(a);
    expect(registry.resolve('card')).toBe(a);
    removeA2();
    expect(registry.resolve('card')).toBeUndefined();
  } finally { a.remove(); b.remove(); }
});

it('rejects live duplicates atomically and detects duplicates connected later', () => {
  const registry = createSharedRegistry(document, true);
  const a = document.createElement('div');
  const b = document.createElement('div');
  document.body.append(a, b);
  try {
    registry.register('card', a);
    expect(() => registry.register('card', b)).toThrow();
    a.remove();
    expect(registry.resolve('card')).toBeUndefined();
    b.remove();
    registry.register('card', b);
    document.body.append(a, b);
    expect(() => registry.resolve('card')).toThrow();
    b.dataset.motionPresence = 'exiting';
    expect(registry.resolve('card')).toBe(a);
    expect(() => registry.register('card', a)).not.toThrow();
  } finally { a.remove(); b.remove(); }
});

it('isolates documents and re-evaluates adoption and reconnection', () => {
  const other = document.implementation.createHTMLDocument('other');
  const registry = createSharedRegistry(document, false);
  const otherRegistry = createSharedRegistry(other, false);
  const a = document.createElement('div');
  document.body.append(a);
  try {
    const remove = registry.register('card', a);
    expect(() => otherRegistry.register('card', a)).toThrow();
    other.adoptNode(a);
    other.body.append(a);
    expect(registry.resolve('card')).toBeUndefined();
    otherRegistry.register('card', a);
    expect(otherRegistry.resolve('card')).toBe(a);
    document.adoptNode(a);
    document.body.append(a);
    expect(registry.resolve('card')).toBe(a);
    expect(otherRegistry.resolve('card')).toBeUndefined();
    remove();
    expect(registry.resolve('card')).toBeUndefined();
  } finally { a.remove(); }
});

it('keeps preview instances isolated across module reloads', async () => {
  // @ts-expect-error Vite supports query suffixes for separate module instances.
  const copy = await import('./shared-registry.js?reload');
  const first = createSharedRegistry(document, false);
  const second = copy.createSharedRegistry(document, false);
  const element = document.createElement('div');
  document.body.append(element);
  try {
    first.register('card', element);
    expect(second.resolve('card')).toBeUndefined();
    expect(first.resolve('card')).toBe(element);
  } finally { element.remove(); }
});

it('clears all registrations and makes old removal tokens harmless after reuse', () => {
  const registry = createSharedRegistry(document, true);
  const element = document.createElement('div');
  document.body.append(element);
  try {
    const staleRemove = registry.register('card', element);
    registry.clear();
    registry.clear();
    expect(registry.resolve('card')).toBeUndefined();
    const remove = registry.register('card', element);
    staleRemove();
    staleRemove();
    expect(registry.resolve('card')).toBe(element);
    remove();
    expect(registry.resolve('card')).toBeUndefined();
  } finally { element.remove(); }
});
