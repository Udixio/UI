import { Component } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SideSheet } from './side-sheet';

expect.extend(toHaveNoViolations);

describe('SideSheet (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<SideSheet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideSheet],
    }).compileComponents();
    fixture = TestBed.createComponent(SideSheet);
    fixture.componentRef.setInput('title', 'Info');
  });

  afterEach(() => {
    document.querySelectorAll('[role="dialog"]').forEach((el) => el.remove());
  });

  it('owns an uncontrolled open state and emits each accepted transition once', () => {
    const changes: boolean[] = [];
    fixture.componentInstance.openChange.subscribe((open) =>
      changes.push(open),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Info');
    const closeButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    closeButton.click();
    fixture.detectChanges();

    expect(changes).toEqual([false]);
  });

  it('starts closed when defaultOpen is false', () => {
    fixture.componentRef.setInput('defaultOpen', false);
    fixture.detectChanges();
    const panel: HTMLElement =
      fixture.nativeElement.querySelector('.bg-surface');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(panel.hasAttribute('inert')).toBe(true);
  });

  it('requests a controlled transition without mutating the rendered value', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('open', true);
    fixture.componentInstance.openChange.subscribe((open) =>
      changes.push(open),
    );
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(changes).toEqual([false]);
    expect(fixture.nativeElement.textContent).toContain('Info');
  });

  it('exposes the panel only after the controlled owner updates open', () => {
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    const panel: HTMLElement =
      fixture.nativeElement.querySelector('.bg-surface');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(panel.hasAttribute('inert')).toBe(true);

    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(panel.getAttribute('aria-hidden')).toBe('false');
    expect(panel.hasAttribute('inert')).toBe(false);
  });

  it('renders role=dialog and aria-modal only for the modal variant, portaled to document.body', () => {
    fixture.detectChanges();
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    fixture.componentRef.setInput('variant', 'modal');
    fixture.detectChanges();

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe(
      dialog?.querySelector('p')?.id,
    );
    expect(fixture.nativeElement.contains(dialog)).toBe(false);
  });

  it('never renders a divider for the modal variant even when explicitly requested', () => {
    fixture.componentRef.setInput('variant', 'modal');
    fixture.componentRef.setInput('divider', true);
    fixture.detectChanges();
    expect(document.querySelector('[role="separator"]')).toBeNull();
  });

  it('exposes the resolved open state to a state-aware className function', () => {
    fixture.componentRef.setInput(
      'className',
      (state: { isOpen: boolean }) => ({
        sideSheet: state.isOpen ? 'is-open' : 'is-closed',
      }),
    );
    fixture.detectChanges();
    const panel: HTMLElement = fixture.nativeElement.querySelector('.bg-surface');
    expect(panel.className).toContain('is-open');
  });

  it('traps focus in the panel, closes on Escape, and restores trigger focus (modal)', fakeAsync(() => {
    @Component({
      standalone: true,
      imports: [SideSheet],
      template: `
        <button (click)="open = true">Open</button>
        <lib-side-sheet
          variant="modal"
          title="Details"
          [open]="open"
          (openChange)="open = $event"
        >
          Body
        </lib-side-sheet>
      `,
    })
    class Harness {
      open = false;
    }

    const harnessFixture = TestBed.createComponent(Harness);
    harnessFixture.detectChanges();
    const trigger: HTMLButtonElement =
      harnessFixture.nativeElement.querySelector('button');
    trigger.focus();
    trigger.click();
    harnessFixture.detectChanges();
    tick();

    const closeButton = document.querySelector(
      '[role="dialog"] button',
    ) as HTMLButtonElement;
    expect(document.activeElement).toBe(closeButton);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    harnessFixture.detectChanges();
    tick();

    expect(document.activeElement).toBe(trigger);
    harnessFixture.destroy();
  }));

  it('does not close on Escape for the standard variant', () => {
    const changes: boolean[] = [];
    fixture.componentInstance.openChange.subscribe((open) =>
      changes.push(open),
    );
    fixture.detectChanges();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();

    expect(changes).toEqual([]);
  });

  it('makes every other document.body child inert and locks scroll while modal and open', () => {
    const outside = document.createElement('button');
    outside.id = 'outside-trigger';
    document.body.appendChild(outside);

    fixture.componentRef.setInput('variant', 'modal');
    fixture.detectChanges();

    expect(outside.inert).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    fixture.destroy();

    expect(outside.inert).toBe(false);
    expect(document.body.style.overflow).toBe('');
    outside.remove();
  });

  it('has no automated accessibility violations for the modal variant', async () => {
    fixture.componentRef.setInput('variant', 'modal');
    fixture.detectChanges();
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(await axe(dialog)).toHaveNoViolations();
  });
});
