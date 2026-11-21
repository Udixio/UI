import '@testing-library/jest-dom/vitest';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import ContextMenu from './ContextMenu.svelte';
import Fixture from './context-menu.fixture.svelte';

describe('ContextMenu', () => {
  it('renders its trigger', () => {
    render(ContextMenu, { props: { trigger: undefined } });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  describe('motion', () => {
    afterEach(cleanup);

    it('grows from the pointer and stays shown, inert, until its exit ends', async () => {
      const onOpenChange = vi.fn();
      render(Fixture, { props: { onOpenChange } });
      const trigger = screen.getByRole('button', { name: 'Document' });
      await fireEvent.contextMenu(trigger, { clientX: 120, clientY: 80 });

      const menu = await screen.findByRole('menu');
      // The motion controller points the scale at the pointer (jsdom has no layout to measure the side).
      expect(menu.style.transformOrigin).not.toBe('');
      const item = screen.getByRole('menuitem', { name: 'Rename' });
      await waitFor(() => expect(item).toHaveFocus());

      // Dispatched and rendered synchronously, to look at the menu before its exit (instant in jsdom) has ended.
      item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      flushSync();
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      // Closed at once for assistive technologies and the keyboard, still seen until the exit has played. (Svelte sets
      // `inert` as a property, which jsdom does not reflect to the attribute.)
      expect(menu).toBeInTheDocument();
      expect((menu.parentElement as HTMLElement).inert).toBe(true);
      await waitFor(() => expect(menu).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  });
});
