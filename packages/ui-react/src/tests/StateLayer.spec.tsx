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

  // `style` was a React DOM passthrough with no Angular counterpart. Its only
  // consumer wanted a transition duration, which is now a typed prop both
  // adapters carry, so the escape hatch is gone rather than left unused.
  it('renders no caller style, the escape hatch having been replaced', () => {
    const withStyle = { style: { opacity: '0.5' } };
    renderInTrigger(<StateLayer colorName="on-primary" {...withStyle} />);

    const layer = screen.getByTestId('trigger').querySelector('span');
    expect(layer?.style.opacity).toBe('');
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

  it('hands the controller the span it rendered as the layer', () => {
    renderInTrigger(<StateLayer colorName="on-primary" />);

    const { layer } = (createController.mock.calls[0] as never[])[0] as {
      layer: HTMLElement;
    };
    expect(layer).toBe(screen.getByTestId('trigger').querySelector('span'));
  });

  // The controller suppresses the ripple through this predicate. Asserting the
  // call alone would stay green with the predicate inverted, so it is invoked.
  it('reports the trigger as disabled only while it actually is', () => {
    render(
      <button className="group/button" data-testid="trigger" disabled>
        <StateLayer colorName="on-primary" />
      </button>,
    );

    const { disabled } = (createController.mock.calls[0] as never[])[0] as {
      disabled: () => boolean;
    };
    expect(disabled()).toBe(true);
  });

  it('reports an enabled trigger as not disabled', () => {
    renderInTrigger(<StateLayer colorName="on-primary" />);

    const { disabled } = (createController.mock.calls[0] as never[])[0] as {
      disabled: () => boolean;
    };
    expect(disabled()).toBe(false);
  });

  it('treats aria-disabled like a disabled attribute', () => {
    render(
      <a className="group/button" data-testid="trigger" aria-disabled="true">
        <StateLayer colorName="on-primary" />
      </a>,
    );

    const { disabled } = (createController.mock.calls[0] as never[])[0] as {
      disabled: () => boolean;
    };
    expect(disabled()).toBe(true);
  });

  const shapeTransition = {
    restingBorderRadius: '8px',
    pressedBorderRadius: '4px',
    enabled: true,
    transition: { duration: 0.2 },
  };

  it('pushes the shape transition to the controller on connect', () => {
    renderInTrigger(
      <StateLayer colorName="on-primary" shapeTransition={shapeTransition} />,
    );

    expect(controller.updateShape).toHaveBeenCalledWith(shapeTransition);
  });

  it('pushes a later shape transition without recreating the controller', () => {
    const { rerender } = renderInTrigger(
      <StateLayer colorName="on-primary" shapeTransition={shapeTransition} />,
    );
    controller.updateShape.mockClear();
    const next = { ...shapeTransition, pressedBorderRadius: '2px' };

    rerender(
      <button className="group/button" data-testid="trigger">
        <StateLayer colorName="on-primary" shapeTransition={next} />
      </button>,
    );

    expect(controller.updateShape).toHaveBeenCalledWith(next);
    expect(createController).toHaveBeenCalledTimes(1);
  });

  // The CSS-only mode wires no ripple, but the utility still has to reach the
  // span -- that class is the entire contract in that mode.
  it('still applies the CSS-only utility when no ripple is wired', () => {
    renderInTrigger(
      <StateLayer colorName="on-primary" stateClassName="state-layer" />,
    );

    const layer = screen.getByTestId('trigger').querySelector('span');
    expect(layer?.className).toContain('state-layer');
    expect(createController).not.toHaveBeenCalled();
  });

  // The colour change needs a duration, and Chip is the consumer. It used to
  // arrive through a generic `style` passthrough -- a React DOM idiom with no
  // Angular counterpart, which is why the Angular chip's selection snapped.
  it('applies a transition duration to the layer', () => {
    renderInTrigger(
      <StateLayer colorName="on-primary" transitionDuration={0.3} />,
    );

    const layer = screen.getByTestId('trigger').querySelector('span');
    expect(layer?.style.transition).toBe('0.3s');
  });

  it('sets no transition when no duration is given', () => {
    renderInTrigger(<StateLayer colorName="on-primary" />);

    const layer = screen.getByTestId('trigger').querySelector('span');
    expect(layer?.style.transition).toBe('');
  });
});
