import { describe, expect, it } from 'vitest';
import {
  defaultClassNames,
  getClassNames,
  mergeClassNames,
  type ClassNameComponent,
  type ElementClasses,
} from './get-classname';
import type { ComponentInterface } from '../component';

interface Sample extends ComponentInterface {
  props: { variant: 'a' | 'b' };
  states: { pressed: boolean };
  elements: ['root', 'label', 'icon'];
}

const states = { variant: 'a', pressed: false } as const;

describe('getClassNames — static element object', () => {
  it('routes each key of an ElementClasses object to its element bucket', () => {
    const result = getClassNames<Sample>({
      classNameList: [{ label: 'uppercase', icon: 'rotate-45' }],
      default: 'root',
      states,
    });
    expect(result.label).toBe('label uppercase');
    expect(result.icon).toBe('icon rotate-45');
    // No item mentioned the root, so no bucket was created for it (existing behaviour).
    expect(result.root).toBeUndefined();
  });

  it('applies consumer values after style defaults, per element, through twMerge', () => {
    const defaults: ClassNameComponent<Sample> = () => ({
      root: 'bg-surface',
      label: 'text-on-surface',
    });
    const consumer: ElementClasses<Sample> = { label: 'text-primary' };
    // classNameList order mirrors defaultClassNames: [consumer, defaults]
    const result = getClassNames<Sample>({
      classNameList: [consumer, defaults],
      default: 'root',
      states,
    });
    expect(result.label).toBe('label text-primary');
    expect(result.label).not.toContain('text-on-surface');
    expect(result.root).toBe('root relative bg-surface');
  });

  it('defaultClassNames accepts the object form on className', () => {
    const style = defaultClassNames<Sample>('root', () => ({
      root: 'bg-surface',
      label: 'text-on-surface',
    }));
    const result = style({
      variant: 'a',
      pressed: false,
      className: { label: 'text-primary' },
    });
    expect(result.label).toBe('label text-primary');
  });
});

describe('mergeClassNames', () => {
  it('returns undefined when nothing is given', () => {
    expect(mergeClassNames<Sample>('root', undefined, '', null)).toBeUndefined();
  });

  it('composes strings, objects and functions in the order received', () => {
    const merged = mergeClassNames<Sample>(
      'root',
      () => ({ label: 'a' }),
      { label: 'b', icon: 'i' },
      'root-class',
    );
    const result = getClassNames<Sample>({
      classNameList: [merged],
      default: 'root',
      states,
    });
    // twMerge keeps both `a` and `b` (no conflict); order is preserved.
    expect(result.label).toBe('label a b');
    expect(result.icon).toBe('icon i');
    expect(result.root).toBe('root relative root-class');
  });

  it('lets a later string override an earlier object on the root through twMerge', () => {
    const merged = mergeClassNames<Sample>('root', { root: 'bg-surface' }, 'bg-primary');
    const result = getClassNames<Sample>({
      classNameList: [merged],
      default: 'root',
      states,
    });
    expect(result.root).toBe('root relative bg-primary');
  });
});
