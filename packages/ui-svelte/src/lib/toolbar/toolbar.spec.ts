import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { axe } from 'jest-axe';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iShare } from '@udixio/icons-rounded-400/share';
import Toolbar from './Toolbar.svelte';
import Fixture from './toolbar.fixture.svelte';

const actions = [
  { id: 'add', label: 'Add', icon: iAdd },
  { id: 'share', label: 'Share', icon: iShare },
];

describe('Toolbar', () => {
  it('renders a named toolbar and forwards native attributes', () => {
    render(Fixture, {
      props: {
        'data-testid': 'toolbar',
        accessibleLabel: 'Document actions',
        'aria-labelledby': 'toolbar-title',
      },
    });

    const toolbar = screen.getByRole('toolbar', { name: 'Document actions' });
    expect(toolbar).toBe(screen.getByTestId('toolbar'));
    expect(toolbar).toHaveAttribute('aria-labelledby', 'toolbar-title');
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('maps the M3 presentation props to shared classes and orientation semantics', async () => {
    const { rerender } = render(Toolbar, {
      props: { 'data-testid': 'toolbar', accessibleLabel: 'Actions' },
    });
    expect(screen.getByTestId('toolbar')).toHaveClass(
      'bg-surface-container',
      'w-full',
    );
    expect(screen.getByTestId('toolbar')).not.toHaveAttribute(
      'aria-orientation',
    );

    await rerender({
      'data-testid': 'toolbar',
      accessibleLabel: 'Actions',
      variant: 'floating',
      color: 'vibrant',
      orientation: 'vertical',
    });
    expect(screen.getByTestId('toolbar')).toHaveClass(
      'bg-primary-container',
      'rounded-[32px]',
      'flex-col',
    );
    expect(screen.getByTestId('toolbar')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
  });

  it('exposes the resolved state to a classes function and merges class', () => {
    render(Toolbar, {
      props: {
        'data-testid': 'toolbar',
        variant: 'floating',
        class: 'min-w-48',
        classes: ({ variant, orientation }) => ({
          toolbar:
            variant === 'floating' && orientation === 'horizontal'
              ? 'custom-floating'
              : 'custom-toolbar',
        }),
      },
    });

    expect(screen.getByTestId('toolbar')).toHaveClass(
      'custom-floating',
      'min-w-48',
    );
  });

  it('renders data-driven actions and moves the remainder into its menu', async () => {
    render(Toolbar, {
      props: {
        accessibleLabel: 'Presentation tools',
        actions,
        maxVisible: 1,
        more: { label: 'More presentation tools' },
      },
    });
    flushSync();

    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Share' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tooltip', {
        name: 'More presentation tools',
        hidden: true,
      }),
    ).not.toBeInTheDocument();

    await fireEvent.click(
      screen.getByRole('button', { name: 'More presentation tools' }),
    );
    flushSync();

    expect(
      await screen.findByRole('menu', { name: 'More presentation tools' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Share' })).toBeInTheDocument();
  });

  it('keeps floating toolbar icon buttons rounded while pressed', async () => {
    render(Fixture, {
      props: { variant: 'floating', accessibleLabel: 'Document actions' },
    });
    flushSync();

    const button = screen.getByRole('button', { name: 'Add' });
    expect(button).toHaveStyle({ borderRadius: '40px' });
    await fireEvent.pointerDown(button, { pointerType: 'mouse' });
    expect(button).toHaveStyle({ borderRadius: '40px' });
  });

  it('has no axe violations for a named toolbar with an action', async () => {
    const { container } = render(Fixture, {
      props: { accessibleLabel: 'Document actions' },
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
