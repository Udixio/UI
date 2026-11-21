import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { iAdd } from '@udixio/icons-rounded-400/add';
import FabMenu from './FabMenu.svelte';

describe('FabMenu', () => {
  afterEach(cleanup);

  it('renders a labelled trigger and opens its action group', async () => {
    render(FabMenu, { props: { label: 'Create', icon: iAdd, actions: [{ id: 'new', label: 'New' }] } });
    const trigger = screen.getByRole('button', { name: 'Create' });
    expect(trigger).toBeInTheDocument();
    await fireEvent.click(trigger);
    expect(screen.getByRole('group', { name: 'Create actions' })).toBeInTheDocument();
  });

  it('moves focus to the first action when the trigger opens the menu', async () => {
    render(FabMenu, { props: { label: 'Create', icon: iAdd, actions: [{ id: 'new', label: 'New' }] } });
    await fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.getByRole('button', { name: 'New' })).toHaveFocus();
  });

  it('leaves focus where it is when the menu opens from code', async () => {
    const elsewhere = document.body.appendChild(document.createElement('button'));
    try {
      const { rerender } = render(FabMenu, {
        props: { label: 'Create', icon: iAdd, actions: [{ id: 'new', label: 'New' }], open: false },
      });
      elsewhere.focus();
      await rerender({ label: 'Create', icon: iAdd, actions: [{ id: 'new', label: 'New' }], open: true });
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(screen.getByRole('button', { name: 'Close Create' })).toHaveAttribute('aria-expanded', 'true');
      expect(elsewhere).toHaveFocus();
    } finally {
      elsewhere.remove();
    }
  });

  it('leaves focus where it is when the menu is open on mount', async () => {
    const elsewhere = document.body.appendChild(document.createElement('button'));
    try {
      elsewhere.focus();
      render(FabMenu, { props: { label: 'Create', icon: iAdd, actions: [{ id: 'new', label: 'New' }], defaultOpen: true } });
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(elsewhere).toHaveFocus();
    } finally {
      elsewhere.remove();
    }
  });

  it('uses distinct controlled-by ids for multiple instances', () => {
    render(FabMenu, { props: { label: 'First', icon: iAdd, actions: [] } });
    render(FabMenu, { props: { label: 'Second', icon: iAdd, actions: [] } });

    const controls = screen.getAllByRole('button').map((button) => button.getAttribute('aria-controls'));
    expect(controls.filter(Boolean)).toHaveLength(2);
    expect(new Set(controls.filter(Boolean)).size).toBe(2);
  });
});
