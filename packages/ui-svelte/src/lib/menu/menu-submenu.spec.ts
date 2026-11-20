import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
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
});
