import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as coreDom from '@udixio/core/dom';
import { StateLayer } from '../lib/index.js';

/**
 * `StateLayer` is public API of `@udixio/ui-react` and had no adapter test at
 * all: the only coverage was the core controller's own spec. These pin what the
 * adapter does today -- including the parts an audit flagged as defects, marked
 * as such -- so that changing the colour contract shows up as a deliberate,
 * visible break rather than a silent behavioural drift.
 */
describe('StateLayer', () => {
  let createController: ReturnType<typeof vi.spyOn>;
  const controller = { updateShape: vi.fn(), destroy: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    createController = vi
      .spyOn(coreDom, 'createStateLayerController')
      .mockReturnValue(controller as never);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderInTrigger = (ui: React.ReactNode) =>
    render(
      <button className="group/button" data-testid="trigger">
        {ui}
      </button>,
    );

  it('renders a span hidden from assistive tech', () => {
    renderInTrigger(<StateLayer colorName="on-primary" />);

    const layer = screen.getByTestId('trigger').querySelector('span');
    expect(layer).not.toBeNull();
    expect(layer).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies the state utility class it was given', () => {
    renderInTrigger(
      <StateLayer colorName="on-primary" stateClassName="state-ripple-group-[button]" />,
    );

    const layer = screen.getByTestId('trigger').querySelector('span');
    expect(layer?.className).toContain('state-ripple-group-[button]');
  });

  it('wires the controller to the outermost element carrying the named group', () => {
    render(
      <div className="group/button" data-testid="outer">
        <span className="group/button">
          <button>
            <StateLayer
              colorName="on-primary"
              stateClassName="state-ripple-group-[button]"
            />
          </button>
        </span>
      </div>,
    );

    expect(createController).toHaveBeenCalledTimes(1);
    const { trigger } = (createController.mock.calls[0] as never[])[0] as {
      trigger: HTMLElement;
    };
    // Not the nearest match, and not the parent: the furthest ancestor holding
    // the group, because the Tailwind state utilities key off that same element.
    expect(trigger).toBe(screen.getByTestId('outer'));
  });

  it('wires no controller for the non-group state utility', () => {
    renderInTrigger(<StateLayer colorName="on-primary" stateClassName="state-layer" />);

    expect(createController).not.toHaveBeenCalled();
  });

  it('destroys the controller on unmount', () => {
    const { unmount } = renderInTrigger(<StateLayer colorName="on-primary" />);
    expect(controller.destroy).not.toHaveBeenCalled();

    unmount();

    expect(controller.destroy).toHaveBeenCalledTimes(1);
  });

  // CHARACTERISATION OF A KNOWN DEFECT (API-DESIGN-COLOR-001). The variable is
  // named `--default-color` but is read FIRST, so an ancestor -- or a class
  // smuggled in through `className`, which is how FabMenu uses it -- overrides
  // the required `colorName` prop. Pinned so that fixing it is a visible break.
  it('reads --default-color ahead of colorName, letting it override the prop', () => {
    renderInTrigger(<StateLayer colorName="on-primary" />);

    const layer = screen.getByTestId('trigger').querySelector('span');
    expect(layer?.style.getPropertyValue('--state-color')).toBe(
      'var(--default-color, var(--color-on-primary))',
    );
  });

  // CHARACTERISATION OF A KNOWN DEFECT (API-DESIGN-COLOR-002). No final
  // fallback: an unknown colour name yields an undefined custom property, and
  // the hover/active utilities that read it have no fallback of their own.
  it('emits an unresolvable custom property for an unknown colour name', () => {
    renderInTrigger(<StateLayer colorName="not-a-token" />);

    const layer = screen.getByTestId('trigger').querySelector('span');
    expect(layer?.style.getPropertyValue('--state-color')).toBe(
      'var(--default-color, var(--color-not-a-token))',
    );
  });

  it('merges a caller style without dropping the state colour', () => {
    renderInTrigger(
      <StateLayer colorName="on-primary" style={{ opacity: '0.5' }} />,
    );

    const layer = screen.getByTestId('trigger').querySelector('span');
    expect(layer?.style.opacity).toBe('0.5');
    expect(layer?.style.getPropertyValue('--state-color')).not.toBe('');
  });

  // CHARACTERISATION OF A HOLLOW PROP (MULTI-PROP-001). `children` is rendered,
  // but all twelve call sites in this package are self-closing and Angular has
  // no equivalent. Pinned so removing it is a decision, not an accident.
  it('renders children, which no call site in this package uses', () => {
    renderInTrigger(
      <StateLayer colorName="on-primary">
        <i data-testid="child" />
      </StateLayer>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
