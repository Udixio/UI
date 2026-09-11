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

  // The colour the caller asked for wins. There is no ambient variable read
  // ahead of it any more: `--default-color` used to be read first, so a class
  // smuggled through `className` silently overrode this required prop.
  it('resolves the state colour from colourName alone', () => {
    renderInTrigger(<StateLayer colorName="on-primary" />);

    const layer = screen.getByTestId('trigger').querySelector('span');
    expect(layer?.style.getPropertyValue('--state-color')).toBe(
      'var(--color-on-primary, var(--color-on-surface))',
    );
  });

  // The hover and focus utilities read `--state-color` with no fallback of
  // their own, so an unresolvable token used to remove the hover state while
  // leaving the ripple visible. The final fallback makes it degrade instead.
  it('falls back to on-surface for an unknown colour name', () => {
    renderInTrigger(<StateLayer colorName="not-a-token" />);

    const layer = screen.getByTestId('trigger').querySelector('span');
    expect(layer?.style.getPropertyValue('--state-color')).toBe(
      'var(--color-not-a-token, var(--color-on-surface))',
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


  // `children` was a hollow prop: rendered, but self-closing at all twelve call
  // sites and absent from the Angular adapter. Removing it from the type left
  // nothing to stop it coming back, and a `@ts-expect-error` guard is not
  // dependable here -- `tsconfig.spec.json` includes only the spec files, so
  // `../lib` resolves through a build artifact and the directive reads as
  // unused whenever that artifact is stale. This asserts the rendered result
  // instead, which holds whatever the type says.
  it('renders no content of its own, even when children are forced in', () => {
    const withChildren = { children: <i data-testid="child" /> };
    renderInTrigger(<StateLayer colorName="on-primary" {...withChildren} />);

    const layer = screen.getByTestId('trigger').querySelector('span');
    expect(layer?.children.length).toBe(0);
    expect(screen.queryByTestId('child')).toBeNull();
  });
});
