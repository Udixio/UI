import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
      />
    </button>
  `,
})
class Harness {
  colorName = 'on-primary';
  stateClassName = 'state-ripple-group-[button]';
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

  // CHARACTERISATION OF A KNOWN DEFECT (API-DESIGN-COLOR-001). The variable is
  // named `--default-color` but is read FIRST, so a class smuggled in through
  // `className` -- which is how FabMenu does it -- overrides the required
  // `colorName` input. Pinned so that fixing it is a visible break.
  it('reads --default-color ahead of colorName, letting it override the input', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.detectChanges();

    expect(layerOf(fixture.nativeElement)?.style.getPropertyValue('--state-color')).toBe(
      'var(--default-color, var(--color-on-primary))',
    );
    fixture.destroy();
  });

  // CHARACTERISATION OF A KNOWN DEFECT (API-DESIGN-COLOR-002). No final
  // fallback: an unknown colour name yields an undefined custom property, and
  // the hover/active utilities that read it have no fallback of their own.
  it('emits an unresolvable custom property for an unknown colour name', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.colorName = 'not-a-token';
    fixture.detectChanges();

    expect(layerOf(fixture.nativeElement)?.style.getPropertyValue('--state-color')).toBe(
      'var(--default-color, var(--color-not-a-token))',
    );
    fixture.destroy();
  });

  // PARITY GAP (PARITY-API-001): React exposes a `style` prop, used at three
  // call sites there, and `children`. Angular exposes neither. Recorded here so
  // the divergence is visible in the suite rather than only in an audit report.
  it('exposes no style input and projects no content, unlike the React adapter', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.detectChanges();

    const layer = layerOf(fixture.nativeElement);
    expect(layer?.style.opacity).toBe('');
    expect(layer?.children.length).toBe(0);
    fixture.destroy();
  });
});
