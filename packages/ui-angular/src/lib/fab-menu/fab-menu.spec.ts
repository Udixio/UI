import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { FabMenu } from './fab-menu';
import type { FabMenuAction } from '@udixio/core';

expect.extend(toHaveNoViolations);

// The real Anime.js Layout controller behind the Fab label needs WAAPI, which
// jsdom does not have. Mock that factory (preserving every other
// `@udixio/core/dom` export) so these tests exercise the component's wiring,
// matching the Switch/TextField specs.
jest.mock('@udixio/core/dom', () => ({
  ...jest.requireActual('@udixio/core/dom'),
  createFabLabelController: jest.fn(() => ({
    update: jest.fn(),
    destroy: jest.fn(),
  })),
}));

const addIcon = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>';
const actions: FabMenuAction[] = [
  { id: 'document', label: 'Document' },
  { id: 'share', label: 'Share', href: '/share' },
];

const getTrigger = (fixture: ComponentFixture<FabMenu>): HTMLButtonElement =>
  fixture.nativeElement.querySelector('[aria-expanded]');

describe('FabMenu (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<FabMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabMenu],
    }).compileComponents();
    fixture = TestBed.createComponent(FabMenu);
    fixture.componentRef.setInput('label', 'Create');
    fixture.componentRef.setInput('icon', addIcon);
    fixture.componentRef.setInput('actions', actions);
  });

  it('exposes a closed disclosure relationship', () => {
    fixture.detectChanges();
    const trigger = getTrigger(fixture);

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.hasAttribute('aria-controls')).toBe(true);
    const group: HTMLElement =
      fixture.nativeElement.querySelector('[role="group"]');
    expect(group.getAttribute('aria-hidden')).toBe('true');
    expect(group.hasAttribute('inert')).toBe(true);
  });

  it('keeps an empty-label disclosure out of the accessibility tree', () => {
    fixture.componentRef.setInput('label', '');
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement.querySelector('.fab-menu');

    expect(root.hidden).toBe(true);
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(getTrigger(fixture).disabled).toBe(true);
  });

  it('opens, labels the group, and focuses the first action', fakeAsync(() => {
    fixture.detectChanges();
    getTrigger(fixture).click();
    fixture.detectChanges();
    tick();

    const group: HTMLElement =
      fixture.nativeElement.querySelector('[role="group"]');
    const trigger = getTrigger(fixture);
    expect(group.getAttribute('aria-label')).toBe('Create actions');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect((document.activeElement as HTMLElement).textContent?.trim()).toBe(
      'Document',
    );
  }));

  it('contracts an extended container trigger into an icon-only color trigger', () => {
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.componentRef.setInput('size', 'large');
    fixture.componentRef.setInput('extended', true);
    fixture.detectChanges();
    const closedTrigger: HTMLButtonElement =
      fixture.nativeElement.querySelector('[aria-expanded="false"]');
    expect(closedTrigger.textContent?.trim()).toBe('Create');
    expect(closedTrigger.className).toContain('bg-secondary-container');
    expect(closedTrigger.className).toContain('h-24');
    const triggerSizer: HTMLElement = fixture.nativeElement.querySelector(
      '.invisible[aria-hidden="true"][inert]',
    );
    expect(triggerSizer).not.toBeNull();
    expect(triggerSizer.querySelector('button')?.className).toContain('h-24');

    closedTrigger.click();
    fixture.detectChanges();

    const openTrigger: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-expanded="true"]',
    );
    expect(openTrigger.getAttribute('aria-label')).toBe('Close Create');
    // The Fab keeps its label mounted so the shared controller can collapse
    // it; the compact trigger hides it from the accessibility tree rather
    // than unmounting it.
    const openLabel = openTrigger.querySelector<HTMLElement>('.label')!;
    expect(openLabel.getAttribute('aria-hidden')).toBe('true');
    expect(openTrigger.className).toContain('bg-secondary');
    expect(openTrigger.className).toContain('rounded-full');
    expect(openTrigger.className).toContain('h-20');
    expect(openTrigger.className).toContain('shadow-none');
    expect(openTrigger.className).not.toContain('h-24');
  });

  it('selects an action, closes, and restores trigger focus', fakeAsync(() => {
    const selected: unknown[] = [];
    fixture.componentInstance.actionSelect.subscribe((event) =>
      selected.push(event),
    );
    fixture.componentRef.setInput('defaultOpen', true);
    fixture.detectChanges();
    tick();

    const action: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[role="group"] button',
    );
    action.click();
    fixture.detectChanges();
    tick();

    expect(selected).toEqual([{ action: actions[0], index: 0 }]);
    expect(
      fixture.nativeElement
        .querySelector('[role="group"]')
        .getAttribute('aria-hidden'),
    ).toBe('true');
    expect(document.activeElement).toBe(getTrigger(fixture));
  }));

  it('closes on Escape and restores focus', async () => {
    // The controller restores focus from a `queueMicrotask` scheduled by a
    // document listener it registers outside the Angular zone, so `tick()`
    // never flushes it; a real microtask turn does.
    fixture.componentRef.setInput('defaultOpen', true);
    fixture.detectChanges();
    await Promise.resolve();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      fixture.nativeElement
        .querySelector('[role="group"]')
        .getAttribute('aria-hidden'),
    ).toBe('true');
    expect(document.activeElement).toBe(getTrigger(fixture));
  });

  it('requests controlled changes without mutating state', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('open', false);
    fixture.componentInstance.openChange.subscribe((open) =>
      changes.push(open),
    );
    fixture.detectChanges();
    getTrigger(fixture).click();
    fixture.detectChanges();

    expect(changes).toEqual([true]);
    expect(
      fixture.nativeElement
        .querySelector('[role="group"]')
        .getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('keeps focus in an open controlled group until its owner accepts closing', fakeAsync(() => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('open', true);
    fixture.componentInstance.openChange.subscribe((open) =>
      changes.push(open),
    );
    fixture.detectChanges();
    tick();
    const action: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[role="group"] button',
    );

    action.click();
    fixture.detectChanges();
    tick();

    expect(changes).toEqual([false]);
    expect(
      fixture.nativeElement
        .querySelector('[role="group"]')
        .hasAttribute('aria-hidden'),
    ).toBe(false);
    expect(document.activeElement).toBe(action);
  }));

  it('uses the action color family for its state layer', () => {
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.componentRef.setInput('defaultOpen', true);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.action-state-layer').className,
    ).toContain('[--default-color:var(--color-on-secondary-container)]');
  });

  it('does not open while disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const trigger = getTrigger(fixture);

    expect(trigger.disabled).toBe(true);
    trigger.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('[role="group"]')
        .getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('has no automated accessibility violations', async () => {
    fixture.componentRef.setInput('defaultOpen', true);
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
