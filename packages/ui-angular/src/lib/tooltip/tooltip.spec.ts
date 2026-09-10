import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import * as coreDom from '@udixio/core/dom';
import { Tooltip } from './tooltip';

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
    <button
      [udxTooltip]="text"
      [udxTooltipTitle]="title"
      [udxTooltipOpenDelay]="openDelay"
      [udxTooltipCloseDelay]="closeDelay"
      [udxTooltipTrigger]="trigger"
      [udxTooltipDescribeTarget]="describeTarget"
      [udxTooltipOpen]="open"
      [udxTooltipDefaultOpen]="defaultOpen"
      (udxTooltipOpenChange)="onOpenChange($event)"
    >
      Trigger
    </button>
  `,
})
class Harness {
  text: string | undefined = 'Copy';
  title: string | undefined = undefined;
  openDelay = 10;
  closeDelay = 10;
  trigger: ('hover' | 'click' | 'focus')[] = ['hover', 'focus'];
  describeTarget = true;
  open: boolean | undefined = undefined;
  defaultOpen = false;
  changes: boolean[] = [];
  onOpenChange(value: boolean): void {
    this.changes.push(value);
  }
}

@Component({
  standalone: true,
  imports: [Tooltip],
  template: `
    <ng-template #custom><span data-testid="custom">Custom body</span></ng-template>
    <button [udxTooltip]="'ignored'" [udxTooltipContent]="custom">Trigger</button>
  `,
})
class TemplateHarness {}

describe('Tooltip directive', () => {
  let fixture: ComponentFixture<Harness>;

  const trigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button');
  const surface = (): HTMLElement | null =>
    document.querySelector('[role="tooltip"]');

  const hover = (): void => {
    trigger().dispatchEvent(
      new MouseEvent('mouseover', {
        bubbles: true,
        relatedTarget: document.body,
      }),
    );
  };
  const unhover = (): void => {
    trigger().dispatchEvent(
      new MouseEvent('mouseout', {
        bubbles: true,
        relatedTarget: document.body,
      }),
    );
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest
      .spyOn(coreDom, 'createTooltipTransitionController')
      .mockReturnValue(mockTooltipTransitionController as never);
    await TestBed.configureTestingModule({ imports: [Harness] }).compileComponents();
    fixture = TestBed.createComponent(Harness);
  });

  afterEach(() => {
    fixture.destroy();
    document.querySelectorAll('[role="tooltip"]').forEach((el) => el.remove());
  });

  // The controller registers its DOM listeners from an `afterRenderEffect`.
  // Angular runs that phase outside the Angular zone, and zone.js binds a
  // listener to its registration zone, so the timers it starts land in the root
  // zone where `fakeAsync`'s `tick()` cannot reach them. These transitions are
  // therefore exercised against real timers, with the delays shortened through
  // the harness inputs.
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  it('attaches to its host without asking the consumer for a target', () => {
    fixture.detectChanges();
    expect(trigger().textContent).toContain('Trigger');
    expect(surface()).not.toBeNull();
  });

  it('keeps the surface hidden from assistive tech while closed', () => {
    fixture.detectChanges();
    expect(surface()?.getAttribute('aria-hidden')).toBe('true');
    expect(surface()?.hasAttribute('inert')).toBe(true);
  });

  it('opens on hover after the open delay and reveals the surface', async () => {
    fixture.detectChanges();
    hover();
    await wait(30);
    fixture.detectChanges();

    expect(surface()?.getAttribute('aria-hidden')).toBe('false');
    expect(surface()?.textContent).toContain('Copy');
  });

  it('stays closed until the open delay has elapsed', async () => {
    fixture.detectChanges();
    hover();
    fixture.detectChanges();

    expect(surface()?.getAttribute('aria-hidden')).toBe('true');
  });

  it('describes the host through aria-describedby while open', async () => {
    fixture.detectChanges();
    expect(trigger().hasAttribute('aria-describedby')).toBe(false);

    hover();
    await wait(30);
    fixture.detectChanges();

    expect(trigger().getAttribute('aria-describedby')).toBe(surface()?.id);
  });

  it('emits each accepted open transition once', async () => {
    fixture.detectChanges();
    hover();
    await wait(30);
    fixture.detectChanges();
    unhover();
    await wait(30);
    fixture.detectChanges();

    expect(fixture.componentInstance.changes).toEqual([true, false]);
  });

  it('renders the rich layout when a title is given', async () => {
    fixture.detectChanges();
    fixture.componentInstance.title = 'Saved';
    fixture.detectChanges();
    hover();
    await wait(30);
    fixture.detectChanges();

    expect(surface()?.textContent).toContain('Saved');
    expect(surface()?.textContent).toContain('Copy');
  });

  it('never opens on its own while controlled', async () => {
    fixture.componentInstance.open = false;
    fixture.detectChanges();

    hover();
    await wait(30);
    fixture.detectChanges();

    expect(surface()?.getAttribute('aria-hidden')).toBe('true');
    // The request is still reported, so a controlled owner can act on it.
    expect(fixture.componentInstance.changes).toEqual([true]);
  });

  it('opens when the controlled owner sets open', () => {
    fixture.componentInstance.open = true;
    fixture.detectChanges();

    expect(surface()?.getAttribute('aria-hidden')).toBe('false');
  });

  it('removes its surface from the document when destroyed', () => {
    fixture.detectChanges();
    expect(surface()).not.toBeNull();
    fixture.destroy();
    expect(surface()).toBeNull();
  });

  it('has no automated accessibility violations while open', async () => {
    fixture.detectChanges();
    hover();
    await wait(30);
    fixture.detectChanges();

    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});

describe('Tooltip directive with nothing to show', () => {
  @Component({
    standalone: true,
    imports: [Tooltip],
    template: `<button [udxTooltip]="text">Trigger</button>`,
  })
  class EmptyHarness {
    text: string | undefined = undefined;
  }

  it('creates no surface while it has no content', () => {
    const fixture = TestBed.createComponent(EmptyHarness);
    fixture.detectChanges();

    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    fixture.destroy();
  });

  it('removes its surface when the content goes away', () => {
    const fixture = TestBed.createComponent(EmptyHarness);
    fixture.componentInstance.text = 'Something';
    fixture.detectChanges();
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();

    fixture.componentInstance.text = undefined;
    fixture.detectChanges();

    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    fixture.destroy();
  });

  it('creates its surface once content arrives', async () => {
    const fixture = TestBed.createComponent(EmptyHarness);
    fixture.detectChanges();
    fixture.componentInstance.text = 'Now I have something';
    fixture.detectChanges();

    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    fixture.destroy();
    document.querySelectorAll('[role="tooltip"]').forEach((el) => el.remove());
  });
});

describe('Tooltip directive custom content', () => {
  beforeEach(() => {
    jest
      .spyOn(coreDom, 'createTooltipTransitionController')
      .mockReturnValue(mockTooltipTransitionController as never);
  });

  it('renders a projected template instead of the default layout', () => {
    const fixture = TestBed.createComponent(TemplateHarness);
    fixture.detectChanges();

    const surface = document.querySelector('[role="tooltip"]');
    expect(surface?.querySelector('[data-testid="custom"]')).not.toBeNull();
    expect(surface?.textContent).not.toContain('ignored');
    fixture.destroy();
  });
});
