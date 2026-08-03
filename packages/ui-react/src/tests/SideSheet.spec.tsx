import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { SideSheet } from '../lib/index.js';

expect.extend(toHaveNoViolations);

describe('SideSheet', () => {
  it('owns an uncontrolled open state and emits each accepted transition once', () => {
    const onOpenChange = vi.fn();
    render(
      <SideSheet title="Info" onOpenChange={onOpenChange}>
        Body
      </SideSheet>,
    );

    expect(screen.getByText('Info')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close Info' }));

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('starts closed when defaultOpen is false', () => {
    const { container } = render(
      <SideSheet defaultOpen={false}>Body</SideSheet>,
    );
    const panel = container.querySelector('.bg-surface') as HTMLElement;
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel).toHaveAttribute('inert');
  });

  it('requests a controlled transition without mutating the rendered value', () => {
    const onOpenChange = vi.fn();
    render(
      <SideSheet open title="Info" onOpenChange={onOpenChange}>
        Body
      </SideSheet>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close Info' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('exposes the panel only after the controlled owner updates open', () => {
    const { container, rerender } = render(
      <SideSheet open={false} title="Info">
        Body
      </SideSheet>,
    );
    const panel = container.querySelector('.bg-surface') as HTMLElement;
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel).toHaveAttribute('inert');

    rerender(
      <SideSheet open title="Info">
        Body
      </SideSheet>,
    );
    expect(panel).toHaveAttribute('aria-hidden', 'false');
    expect(panel).not.toHaveAttribute('inert');
  });

  it('renders role=dialog, aria-modal, and aria-labelledby only for the modal variant', () => {
    const { rerender } = render(<SideSheet title="Info">Body</SideSheet>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <SideSheet variant="modal" title="Info">
        Body
      </SideSheet>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Info' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('exposes the resolved open state to a state-aware className function', () => {
    const { container } = render(
      <SideSheet
        title="Info"
        className={(state) => ({
          sideSheet: state.isOpen ? 'is-open' : 'is-closed',
        })}
      >
        Body
      </SideSheet>,
    );
    expect(container.querySelector('.bg-surface')).toHaveClass('is-open');
  });

  it('never renders a divider for the modal variant even when explicitly requested', () => {
    render(
      <SideSheet variant="modal" divider title="Info">
        Body
      </SideSheet>,
    );
    expect(document.querySelector('[role="separator"]')).not.toBeInTheDocument();
  });

  it('traps focus in the panel, closes on Escape, and restores trigger focus (modal)', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <SideSheet
            variant="modal"
            open={open}
            onOpenChange={setOpen}
            title="Details"
          >
            Body
          </SideSheet>
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();
    fireEvent.click(trigger);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Close Details' }),
      ).toHaveFocus(),
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus(),
    );
  });

  it('does not close on Escape for the standard variant', () => {
    const onOpenChange = vi.fn();
    render(
      <SideSheet title="Info" onOpenChange={onOpenChange}>
        Body
      </SideSheet>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('makes every other document.body child inert and locks scroll while modal and open', () => {
    const outside = document.createElement('button');
    outside.id = 'outside-trigger';
    outside.textContent = 'Outside';
    document.body.appendChild(outside);

    const { unmount } = render(
      <SideSheet variant="modal" title="Info">
        Body
      </SideSheet>,
    );

    expect(outside.inert).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(outside.inert).toBe(false);
    expect(document.body.style.overflow).toBe('');
    outside.remove();
  });

  it('has no automated accessibility violations for the modal variant', async () => {
    const { container } = render(
      <SideSheet variant="modal" title="Details">
        Body content
      </SideSheet>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
