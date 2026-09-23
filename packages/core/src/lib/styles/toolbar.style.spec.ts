import { describe, expect, it } from 'vitest';
import { splitToolbarActions, type ToolbarAction } from '../interfaces';
import { toolbarStyle } from './toolbar.style';

const baseState = {
  variant: 'docked',
  color: 'standard',
  orientation: 'horizontal',
  accessibleLabel: 'Actions',
} as unknown as Parameters<typeof toolbarStyle>[0];

describe('toolbarStyle', () => {
  it('uses the docked standard treatment by default', () => {
    const styles = toolbarStyle({ ...baseState, className: undefined });

    expect(styles.toolbar).toContain('h-16');
    expect(styles.toolbar).toContain('bg-surface-container');
    expect(styles.toolbar).toContain('text-on-surface');
    expect(styles.toolbar).toContain('w-full');
    expect(styles.toolbar).toContain('justify-evenly');
    expect(styles.toolbar).toContain('md:justify-center');
    expect(styles.toolbar).toContain('gap-2');
    expect(styles.toolbar).toContain('px-4');
    expect(styles.toolbar).toContain('py-3');
    expect(styles.toolbar).toContain('[&>button]:min-h-12');
    expect(styles.toolbar).not.toContain('rounded-full');
  });

  it('uses the floating vibrant vertical treatment when requested', () => {
    const styles = toolbarStyle({
      ...baseState,
      variant: 'floating',
      color: 'vibrant',
      orientation: 'vertical',
      className: undefined,
    });

    expect(styles.toolbar).toContain('flex-col');
    expect(styles.toolbar).toContain('bg-primary-container');
    expect(styles.toolbar).toContain('text-on-primary-container');
    expect(styles.toolbar).toContain('rounded-[32px]');
    expect(styles.toolbar).toContain('gap-1');
    expect(styles.toolbar).toContain('w-16');
    expect(styles.toolbar).toContain('px-3');
    expect(styles.toolbar).toContain('py-2');
    expect(styles.toolbar).toContain('shadow-3');
  });

  it('moves non-pinned actions into overflow while preserving action order', () => {
    const actions = [
      { id: 'pin', label: 'Pin', pinned: true },
      { id: 'one', label: 'One' },
      { id: 'two', label: 'Two' },
      { id: 'three', label: 'Three' },
    ] as ToolbarAction[];

    const split = splitToolbarActions({ actions, maxVisible: 2 });

    expect(split.visible.map(({ id }) => id)).toEqual(['pin', 'one', 'two']);
    expect(split.overflow.map(({ id }) => id)).toEqual(['three']);
  });

  it('reserves an overflow slot when responsive actions no longer fit', () => {
    const actions = [
      { id: 'one', label: 'One' },
      { id: 'two', label: 'Two' },
      { id: 'three', label: 'Three' },
    ] as ToolbarAction[];

    const split = splitToolbarActions({
      actions,
      responsive: true,
      availableWidth: 96,
      itemWidth: 48,
    });

    expect(split.visible.map(({ id }) => id)).toEqual(['one']);
    expect(split.overflow.map(({ id }) => id)).toEqual(['two', 'three']);
  });
});
