import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iShare } from '@udixio/icons-rounded-400/share';
import { IconButton, Toolbar } from '../lib/index.js';

expect.extend(toHaveNoViolations);

describe('Toolbar', () => {
  it('renders a named toolbar and preserves IconButton children', () => {
    render(
      <Toolbar accessibleLabel="Document actions" data-testid="toolbar">
        <IconButton label="Add" icon={iAdd} tooltip={false} />
      </Toolbar>,
    );

    expect(screen.getByRole('toolbar', { name: 'Document actions' })).toBe(
      screen.getByTestId('toolbar'),
    );
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('maps the M3 presentation props to shared classes and orientation semantics', () => {
    const { rerender } = render(
      <Toolbar data-testid="toolbar" accessibleLabel="Actions" />,
    );
    expect(screen.getByTestId('toolbar')).toHaveClass(
      'bg-surface-container',
      'w-full',
    );
    expect(screen.getByTestId('toolbar')).not.toHaveAttribute(
      'aria-orientation',
    );

    rerender(
      <Toolbar
        data-testid="toolbar"
        accessibleLabel="Actions"
        variant="floating"
        color="vibrant"
        orientation="vertical"
      />,
    );
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

  it('forwards native props and refs', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Toolbar
        ref={ref}
        data-testid="toolbar"
        aria-labelledby="toolbar-title"
      />,
    );

    expect(ref.current).toBe(screen.getByTestId('toolbar'));
    expect(ref.current).toHaveAttribute('aria-labelledby', 'toolbar-title');
  });

  it('exposes the resolved state to a className function', () => {
    render(
      <Toolbar
        data-testid="toolbar"
        variant="floating"
        className={({ variant, orientation }) => ({
          toolbar:
            variant === 'floating' && orientation === 'horizontal'
              ? 'custom-floating'
              : 'custom-toolbar',
        })}
      />,
    );

    expect(screen.getByTestId('toolbar')).toHaveClass('custom-floating');
  });

  it('renders data-driven actions and moves the remainder into its menu', async () => {
    render(
      <Toolbar
        accessibleLabel="Presentation tools"
        actions={[
          { id: 'share', label: 'Share', icon: iShare },
          { id: 'add', label: 'Add', icon: iAdd },
        ]}
        maxVisible={1}
        more={{ label: 'More presentation tools' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add' }),
    ).not.toBeInTheDocument();

    const trigger = screen.getByRole('button', {
      name: 'More presentation tools',
    });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(
      screen.queryByRole('tooltip', {
        name: 'More presentation tools',
        hidden: true,
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(trigger);

    expect(
      await screen.findByRole('menu', { name: 'More presentation tools' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Add' })).toBeInTheDocument();
  });

  it('allows replacing the default overflow trigger', async () => {
    render(
      <Toolbar
        accessibleLabel="Presentation tools"
        actions={[
          { id: 'share', label: 'Share', icon: iShare },
          { id: 'add', label: 'Add', icon: iAdd },
        ]}
        maxVisible={1}
        renderMore={({ label, onClick }) => (
          <button type="button" aria-label={label} onClick={onClick}>
            Open actions
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'More actions' }),
    ).toHaveTextContent('Open actions');
  });

  it('keeps floating toolbar icon buttons rounded while pressed', async () => {
    render(
      <Toolbar variant="floating" accessibleLabel="Document actions">
        <IconButton label="Add" icon={iAdd} tooltip={false} />
      </Toolbar>,
    );

    const button = screen.getByRole('button', { name: 'Add' });
    await waitFor(() => expect(button).toHaveStyle({ borderRadius: '40px' }));
    fireEvent.pointerDown(button, { pointerType: 'mouse' });
    expect(button).toHaveStyle({ borderRadius: '40px' });
  });

  it('has no axe violations when composed with IconButton controls', async () => {
    const { container } = render(
      <main>
        <h2 id="toolbar-title">Document actions</h2>
        <Toolbar aria-labelledby="toolbar-title">
          <IconButton label="Add" icon={iAdd} tooltip={false} />
        </Toolbar>
      </main>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
