import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { iSave } from '@udixio/icons-rounded-400/save';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/svelte';
import SplitButton from './SplitButton.svelte';
import Fixture from './split-button.fixture.svelte';

expect.extend(toHaveNoViolations);

const actions = [
  { id: 'copy', label: 'Save a copy' },
  { id: 'share', label: 'Share', href: '/share' },
];

describe('SplitButton', () => {
  afterEach(cleanup);

  it('renders two buttons and menu disclosure semantics', () => {
    render(SplitButton, {
      props: { label: 'Save', menuLabel: 'More save options', actions },
    });
    const trigger = screen.getByRole('button', { name: 'More save options' });
    const primary = screen.getByRole('button', { name: 'Save' });
    expect(primary).toHaveAttribute('type', 'button');
    expect(primary).not.toHaveClass('overflow-hidden');
    expect(primary.querySelector('.primary-touch-target')).toHaveClass('h-12');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls');
    expect(trigger).not.toHaveClass('overflow-hidden');
    expect(trigger.querySelector('.menu-touch-target')).toHaveClass('h-12');
  });

  it('uses the accessible label only when the primary action has no visible label', async () => {
    const { rerender } = render(SplitButton, {
      props: {
        label: ' ',
        icon: iSave,
        accessibleLabel: 'Save',
        menuLabel: 'More save options',
        actions,
      },
    });
    expect(screen.getByRole('group', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    await rerender({
      label: 'Save',
      accessibleLabel: 'Different name',
      menuLabel: 'More save options',
      actions,
    });
    expect(screen.getByRole('group', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('opens with ArrowUp and focuses the last action', async () => {
    render(SplitButton, {
      props: { label: 'Save', menuLabel: 'More save options', actions },
    });
    const trigger = screen.getByRole('button', { name: 'More save options' });
    await fireEvent.keyDown(trigger, { key: 'ArrowUp' });

    expect(
      await screen.findByRole('menu', { name: 'More save options' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Share' })).toHaveFocus(),
    );
  });

  it('connects popup behavior when initially invalid props become valid', async () => {
    const { rerender } = render(SplitButton, {
      props: { label: '', menuLabel: 'More save options', actions },
    });
    await rerender({
      label: 'Save',
      menuLabel: 'More save options',
      actions,
    });
    const trigger = screen.getByRole('button', { name: 'More save options' });
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const firstAction = await screen.findByRole('menuitem', {
      name: 'Save a copy',
    });
    await fireEvent.keyDown(firstAction, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('keeps the primary action independent from the menu', async () => {
    let primaryCount = 0;
    render(SplitButton, {
      props: {
        label: 'Save',
        menuLabel: 'More save options',
        actions,
        onPrimaryAction: () => primaryCount++,
      },
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(primaryCount).toBe(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape and outside press', async () => {
    render(SplitButton, {
      props: {
        label: 'Save',
        menuLabel: 'More save options',
        actions,
        defaultOpen: true,
      },
    });
    const trigger = screen.getByRole('button', { name: 'More save options' });
    const item = await screen.findByRole('menuitem', { name: 'Save a copy' });
    await fireEvent.keyDown(item, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());

    await fireEvent.click(trigger);
    await screen.findByRole('menu');
    const outside = document.createElement('button');
    outside.textContent = 'Outside';
    document.body.append(outside);
    await fireEvent.pointerDown(outside);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    outside.remove();
  });

  it('binds open changes and permits a function binding to reject closing', async () => {
    render(Fixture);
    const trigger = screen.getByRole('button', { name: 'More save options' });
    await fireEvent.click(trigger);
    expect(screen.getByTestId('bound-open')).toHaveTextContent('open');
    const regularMenu = within(
      screen.getByRole('menu', { name: 'More save options' }),
    );
    await fireEvent.click(
      regularMenu.getByRole('menuitem', { name: 'Save a copy' }),
    );
    expect(screen.getByTestId('bound-open')).toHaveTextContent('closed');
    expect(screen.getByTestId('last-action')).toHaveTextContent('Save a copy');

    const guardedMenu = within(
      screen.getByRole('menu', { name: 'More guarded save options' }),
    );
    const guardedItem = guardedMenu.getByRole('menuitem', {
      name: 'Save a copy',
    });
    await fireEvent.click(guardedItem);
    expect(screen.getByTestId('guarded-open')).toHaveTextContent('open');
    expect(
      screen.getByRole('button', { name: 'More guarded save options' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not open when disabled or when the required accessible labels are missing', async () => {
    const { rerender } = render(SplitButton, {
      props: {
        label: 'Save',
        menuLabel: 'More save options',
        actions,
        disabled: true,
      },
    });
    expect(
      screen.getByRole('button', { name: 'More save options' }),
    ).toBeDisabled();
    await fireEvent.click(
      screen.getByRole('button', { name: 'More save options' }),
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await rerender({ label: '', menuLabel: '', actions: [] });
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('has no automated accessibility violations when open', async () => {
    const { container } = render(SplitButton, {
      props: {
        label: 'Save',
        menuLabel: 'More save options',
        actions,
        defaultOpen: true,
      },
    });
    await screen.findByRole('menu');

    expect(await axe(container)).toHaveNoViolations();
  });
});
