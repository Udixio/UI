import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { iSave } from '@udixio/icons-rounded-400/save';
import { SplitButton } from './split-button';
import type { SplitButtonAction } from '@udixio/core';

expect.extend(toHaveNoViolations);

const actions: SplitButtonAction[] = [
  { id: 'copy', label: 'Save a copy' },
  { id: 'share', label: 'Share', href: '/share' },
];

const getMenuTrigger = (fixture: ComponentFixture<SplitButton>) =>
  fixture.nativeElement.querySelector(
    '[aria-haspopup="menu"]',
  ) as HTMLButtonElement;

describe('SplitButton (Angular)', () => {
  let fixture: ComponentFixture<SplitButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitButton],
    }).compileComponents();
    fixture = TestBed.createComponent(SplitButton);
    fixture.componentRef.setInput('label', 'Save');
    fixture.componentRef.setInput('menuLabel', 'More save options');
    fixture.componentRef.setInput('actions', actions);
  });

  it('renders two labelled buttons and menu disclosure semantics', () => {
    fixture.detectChanges();
    const primary = fixture.nativeElement.querySelector(
      '.primary-button',
    ) as HTMLButtonElement;
    const trigger = getMenuTrigger(fixture);

    expect(primary.textContent).toContain('Save');
    expect(primary.className).not.toContain('overflow-hidden');
    expect(primary.querySelector('.primary-touch-target')?.className).toContain(
      'h-12',
    );
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBeTruthy();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.className).not.toContain('overflow-hidden');
    expect(trigger.querySelector('.menu-touch-target')?.className).toContain(
      'h-12',
    );
  });

  it('uses the accessible label only when the primary action has no visible label', () => {
    fixture.componentRef.setInput('label', ' ');
    fixture.componentRef.setInput('icon', iSave);
    fixture.componentRef.setInput('accessibleLabel', 'Save');
    fixture.detectChanges();

    const group = fixture.nativeElement.querySelector('[role="group"]');
    const primary = fixture.nativeElement.querySelector('.primary-button');
    expect(group.getAttribute('aria-label')).toBe('Save');
    expect(primary.getAttribute('aria-label')).toBe('Save');
    expect(fixture.nativeElement.querySelector('.primary-label')).toBeNull();

    fixture.componentRef.setInput('label', 'Save');
    fixture.componentRef.setInput('accessibleLabel', 'Different name');
    fixture.detectChanges();
    expect(group.getAttribute('aria-label')).toBe('Save');
    expect(primary.getAttribute('aria-label')).toBeNull();
  });

  it('opens with ArrowDown and focuses the first menu action', async () => {
    fixture.detectChanges();
    getMenuTrigger(fixture).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getMenuTrigger(fixture).getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="menu"]')).not.toBeNull();
    expect(document.activeElement?.textContent?.trim()).toBe('Save a copy');
  });

  it('runs the primary action without opening the menu', () => {
    const actionsRequested: unknown[] = [];
    fixture.componentInstance.primaryAction.subscribe(() =>
      actionsRequested.push('primary'),
    );
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '.primary-button',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(actionsRequested).toEqual(['primary']);
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
  });

  it('selects a menu action and closes the menu', fakeAsync(() => {
    const selected: unknown[] = [];
    fixture.componentInstance.actionSelect.subscribe((event) =>
      selected.push(event),
    );
    fixture.componentRef.setInput('defaultOpen', true);
    fixture.detectChanges();
    tick();
    (
      fixture.nativeElement.querySelector(
        '[role="menuitem"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    tick();

    expect(selected).toEqual([{ action: actions[0], index: 0 }]);
    expect(getMenuTrigger(fixture).getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
  }));

  it('closes on Escape and restores focus to the menu trigger', async () => {
    fixture.componentRef.setInput('defaultOpen', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const trigger = getMenuTrigger(fixture);
    const item = fixture.nativeElement.querySelector(
      '[role="menuitem"]',
    ) as HTMLElement;

    item.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();

    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes when the user presses outside the open menu', async () => {
    fixture.componentRef.setInput('defaultOpen', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const outside = document.createElement('button');
    document.body.append(outside);

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
    outside.remove();
  });

  it('supports controlled open state and disabled buttons', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('open', false);
    fixture.componentInstance.openChange.subscribe((open) =>
      changes.push(open),
    );
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const trigger = getMenuTrigger(fixture);
    expect(trigger.disabled).toBe(true);
    expect(
      (
        fixture.nativeElement.querySelector(
          '.primary-button',
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    trigger.click();
    fixture.detectChanges();
    expect(changes).toEqual([]);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('has no automated accessibility violations when open', async () => {
    fixture.componentRef.setInput('defaultOpen', true);
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
