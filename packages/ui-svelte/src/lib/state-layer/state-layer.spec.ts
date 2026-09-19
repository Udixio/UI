import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import * as coreDom from '@udixio/core/dom';
import Fixture from './state-layer.fixture.svelte';

/**
 * Same matrix as `packages/ui-react/src/tests/StateLayer.spec.tsx`: the layer
 * is a building block of every interactive component, so its adapter contract
 * is pinned once per framework.
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

  const layerIn = (trigger: HTMLElement) => trigger.querySelector('span');
  const firstCall = () =>
    (createController.mock.calls[0] as never[])[0] as {
      trigger: HTMLElement;
      layer: HTMLElement;
      disabled: () => boolean;
    };

  it('renders a span hidden from assistive tech', () => {
    render(Fixture, { props: { colorName: 'on-primary' } });

    const layer = layerIn(screen.getByTestId('trigger'));
    expect(layer).not.toBeNull();
    expect(layer).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies the state utility class it was given', () => {
    render(Fixture, {
      props: { colorName: 'on-primary', stateClassName: 'state-ripple-group-[button]' },
    });

    expect(layerIn(screen.getByTestId('trigger'))?.className).toContain(
      'state-ripple-group-[button]',
    );
  });

  it('wires the controller to the outermost element carrying the named group', () => {
    render(Fixture, {
      props: {
        nested: true,
        colorName: 'on-primary',
        stateClassName: 'state-ripple-group-[button]',
      },
    });

    expect(createController).toHaveBeenCalledTimes(1);
    expect(firstCall().trigger).toBe(screen.getByTestId('outer'));
  });

  it('wires no controller for the non-group state utility', () => {
    render(Fixture, { props: { colorName: 'on-primary', stateClassName: 'state-layer' } });

    expect(createController).not.toHaveBeenCalled();
  });

  it('destroys the controller on unmount', () => {
    const { unmount } = render(Fixture, { props: { colorName: 'on-primary' } });
    expect(controller.destroy).not.toHaveBeenCalled();

    unmount();

    expect(controller.destroy).toHaveBeenCalledTimes(1);
  });

  it('resolves the state colour from colorName alone', () => {
    render(Fixture, { props: { colorName: 'on-primary' } });

    expect(
      layerIn(screen.getByTestId('trigger'))?.style.getPropertyValue('--state-color'),
    ).toBe('var(--color-on-primary, var(--color-on-surface))');
  });

  it('falls back to on-surface for an unknown colour name', () => {
    render(Fixture, { props: { colorName: 'not-a-token' } });

    expect(
      layerIn(screen.getByTestId('trigger'))?.style.getPropertyValue('--state-color'),
    ).toBe('var(--color-not-a-token, var(--color-on-surface))');
  });

  it('renders no content of its own', () => {
    render(Fixture, { props: { colorName: 'on-primary' } });

    expect(layerIn(screen.getByTestId('trigger'))?.children.length).toBe(0);
  });

  it('hands the controller the span it rendered as the layer', () => {
    render(Fixture, { props: { colorName: 'on-primary' } });

    expect(firstCall().layer).toBe(layerIn(screen.getByTestId('trigger')));
  });

  it('reports the trigger as disabled only while it actually is', () => {
    render(Fixture, { props: { colorName: 'on-primary', disabled: true } });

    expect(firstCall().disabled()).toBe(true);
  });

  it('reports an enabled trigger as not disabled', () => {
    render(Fixture, { props: { colorName: 'on-primary' } });

    expect(firstCall().disabled()).toBe(false);
  });

  it('treats aria-disabled like a disabled attribute', () => {
    render(Fixture, { props: { colorName: 'on-primary', trigger: 'a', ariaDisabled: true } });

    expect(firstCall().disabled()).toBe(true);
  });

  const shapeTransition = {
    restingBorderRadius: '8px',
    pressedBorderRadius: '4px',
    enabled: true,
    transition: { duration: 0.2 },
  };

  it('pushes the shape transition to the controller on connect', () => {
    render(Fixture, { props: { colorName: 'on-primary', shapeTransition } });

    expect(controller.updateShape).toHaveBeenCalledWith(shapeTransition);
  });

  it('pushes a later shape transition without recreating the controller', async () => {
    const { rerender } = render(Fixture, { props: { colorName: 'on-primary', shapeTransition } });
    controller.updateShape.mockClear();
    const next = { ...shapeTransition, pressedBorderRadius: '2px' };

    await rerender({ colorName: 'on-primary', shapeTransition: next });
    flushSync();

    expect(controller.updateShape).toHaveBeenCalledWith(next);
    expect(createController).toHaveBeenCalledTimes(1);
  });

  it('still applies the CSS-only utility when no ripple is wired', () => {
    render(Fixture, { props: { colorName: 'on-primary', stateClassName: 'state-layer' } });

    expect(layerIn(screen.getByTestId('trigger'))?.className).toContain('state-layer');
    expect(createController).not.toHaveBeenCalled();
  });

  it('applies a transition duration to the layer', () => {
    render(Fixture, { props: { colorName: 'on-primary', transitionDuration: 0.3 } });

    expect(layerIn(screen.getByTestId('trigger'))?.style.transition).toBe('0.3s');
  });

  it('sets no transition when no duration is given', () => {
    render(Fixture, { props: { colorName: 'on-primary' } });

    expect(layerIn(screen.getByTestId('trigger'))?.style.transition).toBe('');
  });

  it('forwards class to the layer and classes to the style contract', () => {
    render(Fixture, {
      props: { colorName: 'on-primary', class: 'extra', classes: { stateLayer: 'from-map' } },
    });

    const layer = layerIn(screen.getByTestId('trigger'));
    expect(layer?.className).toContain('extra');
    expect(layer?.className).toContain('from-map');
  });
});
