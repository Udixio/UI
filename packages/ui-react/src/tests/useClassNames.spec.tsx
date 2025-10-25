import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClassNames } from '../lib/utils/styles/use-classnames';
import type { ComponentInterface } from '../lib/utils/component';
import type { ClassNameComponent } from '../lib/utils/styles/get-classname';

// Minimal fake component interface for testing the hook
interface TestComp extends ComponentInterface {
  type: 'div';
  elements: ['root', 'label'];
  props: { label?: string };
  states: { active?: boolean };
}

const defaultConfig: ClassNameComponent<TestComp> = (s) => ({
  root: 'bg-default',
  label: s.active ? 'text-active' : 'text-inactive',
});

describe('useClassNames', () => {
  it('merges string default with function override; override wins', () => {
    const override: ClassNameComponent<TestComp> = () => ({
      root: 'px-2 custom-override',
      label: 'text-red-500',
    });

    const { result, rerender } = renderHook(
      (props: any) =>
        useClassNames<TestComp>('root', 'bg-default-root', {
          ...props,
          className: override,
        }),
      { initialProps: { active: false } },
    );

    expect(result.current.root).toContain('root'); // kebab-case prefix
    expect(result.current.root).toContain('relative'); // default relative
    // override precedence should keep both but allow override to win on conflicts; here no conflict
    expect(result.current.root).toContain('custom-override');

    // label from default function should be present and overridden by override
    // default for inactive: text-inactive, but override sets text-red-500
    // since we didn't include defaultConfig, this ensures hook handles function override w/ string default

    rerender({ active: true });
    // Memo invalidated due to states change; new value produced
    expect(result.current.root).toContain('custom-override');
  });

  it('merges function default with string override on default element', () => {
    const { result } = renderHook(() =>
      useClassNames<TestComp>('root', defaultConfig, {
        active: true,
        className: 'p-4',
      }),
    );
    expect(result.current.root).toContain('root');
    expect(result.current.root).toContain('relative');
    expect(result.current.root).toContain('p-4');
    expect(result.current.label).toContain('label');
    expect(result.current.label).toContain('text-active');
  });

  it('memoizes: same inputs => stable reference', () => {
    const states = { active: false, className: 'm-1' } as any;
    const { result, rerender } = renderHook(
      (p: any) => useClassNames<TestComp>('root', defaultConfig, p.states),
      { initialProps: { states } },
    );

    const first = result.current;
    rerender({ states }); // same reference
    const second = result.current;
    expect(second).toBe(first);

    // change shallow reference -> new object allocated
    rerender({ states: { ...states } });
    const third = result.current;
    expect(third).not.toBe(first);
  });
});
