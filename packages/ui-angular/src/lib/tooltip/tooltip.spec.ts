import { Component, ElementRef, viewChild } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import * as coreDom from '@udixio/core/dom';
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

const mockTooltipTransitionController = {
  setOpen: jest.fn(),
  destroy: jest.fn(),
};

@Component({
  standalone: true,
  imports: [Tooltip],
  template: `
    <button #triggerEl>Trigger</button>
    <udx-tooltip
      [target]="triggerRef()"
      text="Copy"
      [openDelay]="openDelay"
      [closeDelay]="closeDelay"
      [trigger]="trigger"
      [describeTarget]="describeTarget"
      [open]="open"
      [defaultOpen]="defaultOpen"
      (openChange)="openChange($event)"
    />
  `,
})
class Harness {
  readonly triggerRef =
    viewChild.required<ElementRef<HTMLButtonElement>>('triggerEl');
  openDelay = 400;
  closeDelay = 150;
  trigger: ('hover' | 'click' | 'focus')[] = ['hover', 'focus'];
  describeTarget = true;
  open: boolean | undefined = undefined;
  defaultOpen = false;
  changes: boolean[] = [];
  openChange(value: boolean): void {
    this.changes.push(value);
  }
}

@Component({
  standalone: true,
  imports: [Tooltip],
  template: `
    <button #first>First trigger</button>
    <udx-tooltip [target]="firstRef()" text="First" [open]="true" />
    <button #second>Second trigger</button>
    <udx-tooltip [target]="secondRef()" text="Second" [open]="true" />
  `,
})
class ExclusiveHarness {
  readonly firstRef =
    viewChild.required<ElementRef<HTMLButtonElement>>('first');
  readonly secondRef =
    viewChild.required<ElementRef<HTMLButtonElement>>('second');
}

@Component({
  standalone: true,
  imports: [Tooltip],
  template: `
    <button #first>First trigger</button>
    <udx-tooltip [target]="firstRef()" text="First" [openDelay]="400" />
    <button #second>Second trigger</button>
    <udx-tooltip [target]="secondRef()" text="Second" [openDelay]="400" />
    <button #last>Last trigger</button>
    <udx-tooltip [target]="lastRef()" text="Last" [openDelay]="400" />
  `,
})
class RapidHoverHarness {
  readonly firstRef =
    viewChild.required<ElementRef<HTMLButtonElement>>('first');
  readonly secondRef =
    viewChild.required<ElementRef<HTMLButtonElement>>('second');
  readonly lastRef = viewChild.required<ElementRef<HTMLButtonElement>>('last');
}

describe('Tooltip (Angular)', () => {
  let fixture: ComponentFixture<Harness>;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest
      .spyOn(coreDom, 'createTooltipTransitionController')
      .mockReturnValue(mockTooltipTransitionController);
    await TestBed.configureTestingModule({
      imports: [Harness, ExclusiveHarness, RapidHoverHarness],
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

  function pointerEvent(
    type: string,
    init: Partial<PointerEvent> & { pointerType: string; pointerId: number },
  ): Event {
    const event = new Event(type, { bubbles: true });
    Object.entries(init).forEach(([key, value]) =>
      Object.defineProperty(event, key, { value }),
    );
    return event;
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
      new MouseEvent('mouseover', {
        bubbles: true,
        relatedTarget: document.body,
      }),
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
      new MouseEvent('mouseout', {
        bubbles: true,
        relatedTarget: document.body,
      }),
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

  it('cancels stale openings while rapidly hovering a list of triggers', fakeAsync(() => {
    const rapid = TestBed.createComponent(RapidHoverHarness);
    rapid.detectChanges();
    const [first, second, last] = Array.from(
      rapid.nativeElement.querySelectorAll<HTMLButtonElement>('button'),
    );
    const enter = (target: HTMLElement) =>
      target.dispatchEvent(
        new MouseEvent('mouseover', {
          bubbles: true,
          relatedTarget: document.body,
        }),
      );
    const leave = (target: HTMLElement) =>
      target.dispatchEvent(
        new MouseEvent('mouseout', {
          bubbles: true,
          relatedTarget: document.body,
        }),
      );

    enter(first);
    tick(100);
    leave(first);
    enter(second);
    tick(100);
    leave(second);
    enter(last);

    tick(399);
    rapid.detectChanges();
    expect(
      Array.from(document.querySelectorAll('[role="tooltip"]')).filter(
        (tooltip) => tooltip.getAttribute('aria-hidden') === 'false',
      ),
    ).toHaveLength(0);
    tick(1);
    rapid.detectChanges();

    const visible = Array.from(
      document.querySelectorAll<HTMLElement>('[role="tooltip"]'),
    ).filter((tooltip) => tooltip.getAttribute('aria-hidden') === 'false');
    expect(visible).toHaveLength(1);
    expect(visible[0].textContent).toContain('Last');
    rapid.destroy();
  }));

  it('animates the first opening after the hidden surface is connected', fakeAsync(() => {
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();

    expect(mockTooltipTransitionController.setOpen).toHaveBeenCalledWith(
      false,
      true,
    );
    mockTooltipTransitionController.setOpen.mockClear();

    getTrigger().dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();

    expect(mockTooltipTransitionController.setOpen).toHaveBeenCalledWith(true);
  }));

  it('keeps a long-press tooltip visible for 1.5s after touch release', fakeAsync(() => {
    fixture.detectChanges();
    const trigger = getTrigger();

    trigger.dispatchEvent(
      pointerEvent('pointerdown', {
        pointerType: 'touch',
        pointerId: 7,
        clientX: 20,
        clientY: 30,
      }),
    );
    const contextMenu = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });
    expect(trigger.dispatchEvent(contextMenu)).toBe(false);
    tick(499);
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('true');

    tick(1);
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('false');

    trigger.dispatchEvent(
      pointerEvent('pointerup', { pointerType: 'touch', pointerId: 7 }),
    );
    tick(1499);
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('false');
    tick(1);
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('true');
  }));

  it('does not open for a short touch or a moved touch', fakeAsync(() => {
    fixture.detectChanges();
    const trigger = getTrigger();

    trigger.dispatchEvent(
      pointerEvent('pointerdown', {
        pointerType: 'touch',
        pointerId: 3,
        clientX: 0,
        clientY: 0,
      }),
    );
    tick(200);
    trigger.dispatchEvent(
      pointerEvent('pointerup', { pointerType: 'touch', pointerId: 3 }),
    );
    tick(500);
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('true');

    trigger.dispatchEvent(
      pointerEvent('pointerdown', {
        pointerType: 'touch',
        pointerId: 4,
        clientX: 0,
        clientY: 0,
      }),
    );
    trigger.dispatchEvent(
      pointerEvent('pointermove', {
        pointerType: 'touch',
        pointerId: 4,
        clientX: 20,
        clientY: 0,
      }),
    );
    tick(500);
    fixture.detectChanges();
    expect(getTooltip().getAttribute('aria-hidden')).toBe('true');
  }));

  it('can remain visual without duplicating the target accessible name', () => {
    fixture.componentInstance.describeTarget = false;
    fixture.detectChanges();
    getTrigger().setAttribute('aria-describedby', 'existing-description');

    getTrigger().dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    expect(getTooltip().getAttribute('aria-hidden')).toBe('false');
    expect(getTrigger().getAttribute('aria-describedby')).toBe(
      'existing-description',
    );
  });

  it('keeps only the most recently claimed tooltip visible', () => {
    const exclusive = TestBed.createComponent(ExclusiveHarness);
    exclusive.detectChanges();
    exclusive.detectChanges();

    const visibleTooltips = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>('[role="tooltip"]'),
      ).filter((tooltip) => tooltip.getAttribute('aria-hidden') === 'false');

    expect(visibleTooltips()).toHaveLength(1);
    expect(visibleTooltips()[0].textContent).toContain('Second');

    exclusive.nativeElement
      .querySelectorAll('button')[0]
      .dispatchEvent(new FocusEvent('focus'));
    exclusive.detectChanges();
    exclusive.detectChanges();

    expect(visibleTooltips()).toHaveLength(1);
    expect(visibleTooltips()[0].textContent).toContain('First');
    exclusive.destroy();
  });

  it('closes on Escape from the open state', () => {
    fixture.componentInstance.defaultOpen = true;
    fixture.detectChanges();

    getTrigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(getTooltip().getAttribute('aria-hidden')).toBe('true');
  });

  it('toggles immediately for trigger=["click"] and ignores hover', fakeAsync(() => {
    fixture.componentInstance.trigger = ['click'];
    fixture.detectChanges();
    const trigger = getTrigger();

    trigger.dispatchEvent(
      new MouseEvent('mouseover', {
        bubbles: true,
        relatedTarget: document.body,
      }),
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
      <udx-button #buttonHost label="Trigger" />
      <udx-tooltip [target]="hostRef()" text="Copy" />
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
    const hostElement: HTMLElement =
      fixture.nativeElement.querySelector('udx-button');
    const innerButton = hostElement.querySelector('button') as HTMLElement;
    const getTooltip = () =>
      document.querySelector('[role="tooltip"]') as HTMLElement;

    expect(getComputedStyle(hostElement).display).toBe('contents');

    // The browser dispatches mouseover at the real, box-generating element
    // the pointer actually entered (the inner <button>); it bubbles up
    // through the display:contents host to Tooltip's listener.
    innerButton.dispatchEvent(
      new MouseEvent('mouseover', {
        bubbles: true,
        relatedTarget: document.body,
      }),
    );
    tick(400);
    fixture.detectChanges();

    expect(getTooltip().getAttribute('aria-hidden')).toBe('false');
  }));
});
