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

const addIcon = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>';
const actions: FabMenuAction[] = [
  { id: 'document', label: 'Document' },
  { id: 'share', label: 'Share', href: '/share' },
];

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
    const trigger: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.hasAttribute('aria-controls')).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="group"]')).toBeNull();
  });

  it('keeps an empty-label disclosure out of the accessibility tree', () => {
    fixture.componentRef.setInput('label', '');
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement.querySelector('.fab-menu');

    expect(root.hidden).toBe(true);
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
  });

  it('opens, labels the group, and focuses the first action', fakeAsync(() => {
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    tick();

    const group: HTMLElement =
      fixture.nativeElement.querySelector('[role="group"]');
    const trigger: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(group.getAttribute('aria-label')).toBe('Create actions');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect((document.activeElement as HTMLElement).textContent?.trim()).toBe(
      'Document',
    );
  }));

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
    expect(fixture.nativeElement.querySelector('[role="group"]')).toBeNull();
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('button'),
    );
  }));

  it('closes on Escape and restores focus', fakeAsync(() => {
    fixture.componentRef.setInput('defaultOpen', true);
    fixture.detectChanges();
    tick();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    tick();

    expect(fixture.nativeElement.querySelector('[role="group"]')).toBeNull();
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('button'),
    );
  }));

  it('requests controlled changes without mutating state', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('open', false);
    fixture.componentInstance.openChange.subscribe((open) =>
      changes.push(open),
    );
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(changes).toEqual([true]);
    expect(fixture.nativeElement.querySelector('[role="group"]')).toBeNull();
  });

  it('does not open while disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const trigger: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(trigger.disabled).toBe(true);
    trigger.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="group"]')).toBeNull();
  });

  it('has no automated accessibility violations', async () => {
    fixture.componentRef.setInput('defaultOpen', true);
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
