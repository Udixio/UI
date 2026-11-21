import '@testing-library/jest-dom/vitest';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import Fixture from './menu-submenu.fixture.svelte';

describe('MenuSubmenu', () => {
  afterEach(cleanup);

  it('keeps the nested menu in the DOM, hidden, while the submenu is closed', () => {
    render(Fixture);

    expect(screen.getByText('Copy link')).toBeInTheDocument();
    expect(screen.getByText('Copy link')).not.toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Share' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('opens the nested menu and moves focus inside it on ArrowRight', async () => {
    render(Fixture);
    const trigger = screen.getByRole('menuitem', { name: 'Share' });

    trigger.focus();
    await fireEvent.keyDown(trigger, { key: 'ArrowRight' });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Copy link' })).toBeVisible();
  });

  it('mounts nothing for a lazy submenu until it opens', async () => {
    render(Fixture, { props: { lazy: true } });

    expect(screen.queryByText('Copy link')).not.toBeInTheDocument();

    const trigger = screen.getByRole('menuitem', { name: 'Share' });
    trigger.focus();
    await fireEvent.keyDown(trigger, { key: 'ArrowRight' });

    expect(screen.getByRole('menuitem', { name: 'Copy link' })).toBeVisible();
  });

  it('grows the nested menu from its trigger and keeps it shown, inert, until its exit ends', async () => {
    render(Fixture);
    const trigger = screen.getByRole('menuitem', { name: 'Share' });
    trigger.focus();
    await fireEvent.keyDown(trigger, { key: 'ArrowRight' });
    const nested = screen.getByRole('menu', { name: 'Share submenu' });
    const surface = nested.parentElement as HTMLElement;
    // The motion controller points the scale at the trigger.
    expect(nested.style.transformOrigin).not.toBe('');

    // Dispatched and rendered synchronously, to look at the menu before its exit (instant in jsdom) has ended.
    screen
      .getByRole('menuitem', { name: 'Copy link' })
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    flushSync();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // Closed at once for assistive technologies and the keyboard, still seen until the exit has played. (Svelte sets
    // `inert` as a property, which jsdom does not reflect to the attribute.)
    expect(surface.inert).toBe(true);
    expect(surface).not.toHaveAttribute('hidden');
    await waitFor(() => expect(surface).toHaveAttribute('hidden'));
  });

  it('keeps a lazy nested menu rendered until its exit ends', async () => {
    render(Fixture, { props: { lazy: true } });
    const trigger = screen.getByRole('menuitem', { name: 'Share' });
    trigger.focus();
    await fireEvent.keyDown(trigger, { key: 'ArrowRight' });
    const copy = screen.getByRole('menuitem', { name: 'Copy link' });

    copy.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    flushSync();
    expect(copy).toBeInTheDocument();
    await waitFor(() => expect(copy).not.toBeInTheDocument());
  });
});
