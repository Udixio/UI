import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { StateLayerShapeTransition } from '@udixio/core';
import * as coreDom from '@udixio/core/dom';
import { StateLayer } from './state-layer';

/**
 * `StateLayer` is public API of `@udixio/ui-angular` and had no adapter test at
 * all: the only coverage was the core controller's own spec. These mirror the
 * React adapter's suite scenario for scenario, and pin the parts an audit
 * flagged as defects so that fixing them is a visible break.
 */
@Component({
  standalone: true,
  imports: [StateLayer],
  template: `
    <button class="group/button" data-testid="trigger">
      <udx-state-layer
        [colorName]="colorName"
        [stateClassName]="stateClassName"
        [shapeTransition]="shapeTransition"
      />
    </button>
  `,
})
class Harness {
  colorName = 'on-primary';
  stateClassName = 'state-ripple-group-[button]';
  shapeTransition: StateLayerShapeTransition | undefined = undefined;
}

@Component({
  standalone: true,
  imports: [StateLayer],
  template: `
    <div class="group/button" data-testid="outer">
      <span class="group/button">
        <button>
          <udx-state-layer
            colorName="on-primary"
            stateClassName="state-ripple-group-[button]"
          />
        </button>
      </span>
    </div>
  `,
})
class NestedGroupHarness {}

@Component({
  standalone: true,
  imports: [StateLayer],
  template: `
    <button class="group/button" disabled data-testid="trigger">
      <udx-state-layer colorName="on-primary" stateClassName="state-ripple-group-[button]" />
    </button>
  `,
})
class DisabledHarness {}

const shapeTransition = {
  restingBorderRadius: '8px',
  pressedBorderRadius: '4px',
  enabled: true,
  transition: { duration: 0.2 },
};

describe('StateLayer', () => {
  const controller = { updateShape: jest.fn(), destroy: jest.fn() };
  let createController: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    createController = jest
      .spyOn(coreDom, 'createStateLayerController')
      .mockReturnValue(controller as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const layerOf = (root: HTMLElement): HTMLElement | null =>
    root.querySelector('udx-state-layer span');

  it('renders a span hidden from assistive tech', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.detectChanges();

    const layer = layerOf(fixture.nativeElement);
    expect(layer).not.toBeNull();
    expect(layer?.getAttribute('aria-hidden')).toBe('true');
    fixture.destroy();
  });

  it('applies the state utility class it was given', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.detectChanges();

    expect(layerOf(fixture.nativeElement)?.className).toContain(
      'state-ripple-group-[button]',
    );
    fixture.destroy();
  });

  it('wires the controller to the outermost element carrying the named group', () => {
    const fixture = TestBed.createComponent(NestedGroupHarness);
    fixture.detectChanges();

    expect(createController).toHaveBeenCalledTimes(1);
    const { trigger } = createController.mock.calls[0][0];
    // Not the nearest match, and not the parent: the furthest ancestor holding
    // the group, because the Tailwind state utilities key off that same element.
    expect(trigger).toBe(
      fixture.nativeElement.querySelector('[data-testid="outer"]'),
    );
    fixture.destroy();
  });

  it('wires no controller for the non-group state utility', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.stateClassName = 'state-layer';
    fixture.detectChanges();

    expect(createController).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('destroys the controller on destroy', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.detectChanges();
    expect(controller.destroy).not.toHaveBeenCalled();

    fixture.destroy();

    expect(controller.destroy).toHaveBeenCalledTimes(1);
  });

  // The colour the caller asked for wins. There is no ambient variable read
  // ahead of it any more: `--default-color` used to be read first, so a class
  // smuggled through `className` silently overrode this required input.
  it('resolves the state colour from colourName alone', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.detectChanges();

    expect(layerOf(fixture.nativeElement)?.style.getPropertyValue('--state-color')).toBe(
      'var(--color-on-primary, var(--color-on-surface))',
    );
    fixture.destroy();
  });

  // The hover and focus utilities read `--state-color` with no fallback of
  // their own, so an unresolvable token used to remove the hover state while
  // leaving the ripple visible. The final fallback makes it degrade instead.
  it('falls back to on-surface for an unknown colour name', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.colorName = 'not-a-token';
    fixture.detectChanges();

    expect(layerOf(fixture.nativeElement)?.style.getPropertyValue('--state-color')).toBe(
      'var(--color-not-a-token, var(--color-on-surface))',
    );
    fixture.destroy();
  });

  it('hands the controller the span it rendered as the layer', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.detectChanges();

    expect(createController.mock.calls[0][0].layer).toBe(
      layerOf(fixture.nativeElement),
    );
    fixture.destroy();
  });

  // The controller suppresses the ripple through this predicate. Asserting the
  // call alone would stay green with the predicate inverted, so it is invoked.
  it('reports an enabled trigger as not disabled', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.detectChanges();

    expect(createController.mock.calls[0][0].disabled()).toBe(false);
    fixture.destroy();
  });

  it('reports the trigger as disabled only while it actually is', () => {
    const fixture = TestBed.createComponent(DisabledHarness);
    fixture.detectChanges();

    expect(createController.mock.calls[0][0].disabled()).toBe(true);
    fixture.destroy();
  });

  it('pushes the shape transition to the controller on connect', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.shapeTransition = shapeTransition;
    fixture.detectChanges();

    expect(controller.updateShape).toHaveBeenCalledWith(shapeTransition);
    fixture.destroy();
  });

  it('pushes a later shape transition without recreating the controller', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.shapeTransition = shapeTransition;
    fixture.detectChanges();
    controller.updateShape.mockClear();

    fixture.componentInstance.shapeTransition = {
      ...shapeTransition,
      pressedBorderRadius: '2px',
    };
    fixture.detectChanges();

    expect(controller.updateShape).toHaveBeenCalledWith(
      fixture.componentInstance.shapeTransition,
    );
    expect(createController).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });

  // The CSS-only mode wires no ripple, but the utility still has to reach the
  // span -- that class is the entire contract in that mode.
  it('still applies the CSS-only utility when no ripple is wired', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.stateClassName = 'state-layer';
    fixture.detectChanges();

    expect(layerOf(fixture.nativeElement)?.className).toContain('state-layer');
    expect(createController).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
