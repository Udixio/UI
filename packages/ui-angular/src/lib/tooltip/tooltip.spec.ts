import { Component, ElementRef, viewChild } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Tooltip } from './tooltip';
import { Button } from '../button/button';

expect.extend(toHaveNoViolations);

// jsdom lacks ResizeObserver; AnchorPositioner's fallback controller needs it
// to mount when the environment reports no CSS Anchor Positioning support.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(globalThis as any).ResizeObserver ??= NoopResizeObserver;

// The real Anime.js animation needs WAAPI (`Element.prototype.animate`),
// which jsdom does not implement -- mock the factory (preserving every
// other `@udixio/core/dom` export) so tests exercise the component's
// wiring, not Anime.js internals against a fake DOM.
jest.mock('@udixio/core/dom', () => ({
  ...jest.requireActual('@udixio/core/dom'),
  createTooltipTransitionController: jest.fn(() => ({
    setOpen: jest.fn(),
    destroy: jest.fn(),
  })),
}));

@Component({
  standalone: true,
  imports: [Tooltip],
  template: `
    <button #triggerEl>Trigger</button>
    <lib-tooltip
      [target]="triggerRef()"
      text="Copy"
      [openDelay]="openDelay"
      [closeDelay]="closeDelay"
      [trigger]="trigger"
      [open]="open"
      [defaultOpen]="defaultOpen"
      (openChange)="openChange($event)"
    />
  `,
})
class Harness {
  readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>(
    'triggerEl',
  );
  openDelay = 400;
  closeDelay = 150;
  trigger: ('hover' | 'click' | 'focus')[] = ['hover', 'focus'];
  open: boolean | undefined = undefined;
  defaultOpen = false;
  changes: boolean[] = [];
  openChange(value: boolean): void {
    this.changes.push(value);
  }
}

describe('Tooltip (Angular)', () => {
  let fixture: ComponentFixture<Harness>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Harness],
    }).compileComponents();
    fixture = TestBed.createComponent(Harness);
  });

  afterEach(() => {
    document.querySelectorAll('[role="tooltip"]').forEach((el) => el.remove());
  });

  function getTrigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  function getTooltip(): HTMLElement {
    return document.querySelector('[role="tooltip"]') as HTMLElement;
  }

  it('starts hidden and hides the surface from assistive tech', () => {
    fixture.detectChanges();
    const tooltip = getTooltip();

    expect(tooltip.getAttribute('aria-hidden')).toBe('true');
    expect(tooltip.hasAttribute('inert')).toBe(true);
    expect(getTrigger().hasAttribute('aria-describedby')).toBe(false);
  });

  it('starts open when defaultOpen is true', () => {
    fixture.componentInstance.defaultOpen = true;
    fixture.detectChanges();

    expect(getTooltip().getAttribute('aria-hidden')).toBe('false');
  });

  it('opens on hover after openDelay and links aria-describedby, closes after closeDelay', fakeAsync(() => {
    fixture.detectChanges();
    const trigger = getTrigger();

    trigger.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }),
    );
    tick(399);
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('true');

    tick(1);
    fixture.detectChanges();
    const tooltip = getTooltip();
    expect(tooltip.getAttribute('aria-hidden')).toBe('false');
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);

    trigger.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }),
    );
    tick(149);
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('false');
    tick(1);
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('true');
  }));

  it('opens on focus immediately, without waiting for openDelay', () => {
    fixture.detectChanges();
    getTrigger().dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    expect(getTooltip().getAttribute('aria-hidden')).toBe('false');
  });

  it('closes on Escape from the open state', () => {
    fixture.componentInstance.defaultOpen = true;
    fixture.detectChanges();

    getTrigger().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape' }),
    );
    fixture.detectChanges();

    expect(getTooltip().getAttribute('aria-hidden')).toBe('true');
  });

  it('toggles immediately for trigger=["click"] and ignores hover', fakeAsync(() => {
    fixture.componentInstance.trigger = ['click'];
    fixture.detectChanges();
    const trigger = getTrigger();

    trigger.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }),
    );
    tick(1000);
    expect(getTooltip().getAttribute('aria-hidden')).toBe('true');

    trigger.click();
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('false');

    trigger.click();
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('true');
  }));

  it('requests a controlled transition without mutating the rendered value', () => {
    fixture.componentInstance.trigger = ['click'];
    fixture.componentInstance.open = false;
    fixture.detectChanges();

    getTrigger().click();
    fixture.detectChanges();

    expect(fixture.componentInstance.changes).toEqual([true]);
    expect(getTooltip().getAttribute('aria-hidden')).toBe('true');
  });

  it('exposes the panel once the controlled owner updates open', () => {
    fixture.componentInstance.open = false;
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('true');

    fixture.componentInstance.open = true;
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('false');
  });

  it('has no automated accessibility violations while open', async () => {
    fixture.componentInstance.defaultOpen = true;
    fixture.detectChanges();

    expect(await axe(getTooltip())).toHaveNoViolations();
  });
});

describe('Tooltip (Angular) targeting a display:contents component host', () => {
  // Every interactive Udixio component (`Button`, `IconButton`, `Chip`, ...)
  // hosts itself with `display: contents`, which generates no box of its
  // own -- native `mouseenter`/`mouseleave` are never dispatched on such an
  // element. This is the real-world shape `target` must support.
  @Component({
    standalone: true,
    imports: [Tooltip, Button],
    template: `
      <lib-button #buttonHost label="Trigger" />
      <lib-tooltip [target]="hostRef()" text="Copy" />
    `,
  })
  class ButtonTargetHarness {
    readonly hostRef = viewChild.required<ElementRef<HTMLElement>>(
      'buttonHost',
      { read: ElementRef },
    );
  }

  let fixture: ComponentFixture<ButtonTargetHarness>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonTargetHarness],
    }).compileComponents();
    fixture = TestBed.createComponent(ButtonTargetHarness);
  });

  afterEach(() => {
    document.querySelectorAll('[role="tooltip"]').forEach((el) => el.remove());
  });

  it('opens on hover even though the target element renders no box of its own', fakeAsync(() => {
    fixture.detectChanges();
    const hostElement: HTMLElement = fixture.nativeElement.querySelector(
      'lib-button',
    );
    const innerButton = hostElement.querySelector('button') as HTMLElement;
    const getTooltip = () =>
      document.querySelector('[role="tooltip"]') as HTMLElement;

    expect(getComputedStyle(hostElement).display).toBe('contents');

    // The browser dispatches mouseover at the real, box-generating element
    // the pointer actually entered (the inner <button>); it bubbles up
    // through the display:contents host to Tooltip's listener.
    innerButton.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }),
    );
    tick(400);
    fixture.detectChanges();

    expect(getTooltip().getAttribute('aria-hidden')).toBe('false');
  }));
});
