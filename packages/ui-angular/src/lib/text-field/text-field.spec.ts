import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TextField } from './text-field';

expect.extend(toHaveNoViolations);

// The real Anime.js Layout controller needs WAAPI, and the anchor positioner
// fallback needs ResizeObserver -- neither exists in jsdom. Mock these
// factories (preserving every other `@udixio/core/dom` export) so tests
// exercise the component's wiring, matching the Switch/DatePicker specs.
jest.mock('@udixio/core/dom', () => ({
  ...jest.requireActual('@udixio/core/dom'),
  createTextFieldLabelController: jest.fn(() => ({
    update: jest.fn(),
    destroy: jest.fn(),
  })),
  createTextareaAutosizeController: jest.fn(() => ({
    update: jest.fn(),
    destroy: jest.fn(),
  })),
  createAnchorPositionerController: jest.fn(() => ({
    update: jest.fn(),
    destroy: jest.fn(),
  })),
}));

function findButtonByTextOrNull(
  root: HTMLElement,
  text: string,
): HTMLButtonElement | null {
  const button = Array.from(root.querySelectorAll('button')).find(
    (el) => el.textContent?.trim() === text,
  );
  return (button as HTMLButtonElement) ?? null;
}

function findButtonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = findButtonByTextOrNull(root, text);
  if (!button) throw new Error(`No button with text "${text}"`);
  return button;
}

@Component({
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<udx-text-field label="Email" [(value)]="value" />`,
})
class ControlledTextFieldHost {
  value = '';
}

describe('TextField (Angular)', () => {
  let fixture: ComponentFixture<TextField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextField, ControlledTextFieldHost],
    }).compileComponents();
    fixture = TestBed.createComponent(TextField);
    fixture.componentRef.setInput('label', 'Email');
  });

  afterEach(() => {
    // AnchorPositioner portals to document.body; destroying the fixture
    // runs ngOnDestroy, which removes it, so later tests don't inherit it.
    fixture.destroy();
  });

  it('owns an uncontrolled value and emits each accepted transition once', () => {
    const changes: string[] = [];
    fixture.componentRef.setInput('defaultValue', 'a@b.com');
    fixture.componentInstance.valueChange.subscribe((v) => changes.push(v));
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    expect(input.value).toBe('a@b.com');
    input.value = 'c@d.com';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.value).toBe('c@d.com');
    expect(changes).toEqual(['c@d.com']);
  });

  it('requests a controlled change without mutating the rendered value', () => {
    const changes: string[] = [];
    fixture.componentRef.setInput('value', 'a@b.com');
    fixture.componentInstance.valueChange.subscribe((v) => changes.push(v));
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    input.value = 'c@d.com';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.value).toBe('a@b.com');
    expect(changes).toEqual(['c@d.com']);
  });

  it('blocks interaction while disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    expect(input.disabled).toBe(true);
  });

  it('reflects an error via aria-invalid and links the supporting text', () => {
    fixture.componentRef.setInput('errorText', 'Required');
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    expect(input.getAttribute('aria-invalid')).toBe('true');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const helper = fixture.nativeElement.querySelector(`#${describedBy}`);
    expect(helper?.textContent).toContain('Required');
  });

  it('fires focus/blur exactly once per transition', () => {
    const focusEvents: void[] = [];
    const blurEvents: void[] = [];
    fixture.componentInstance.focus.subscribe(() =>
      focusEvents.push(undefined),
    );
    fixture.componentInstance.blur.subscribe(() => blurEvents.push(undefined));
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(focusEvents.length).toBe(1);

    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(blurEvents.length).toBe(1);
  });

  it('aligns an outlined floating label with its legend when a leading icon is present', () => {
    fixture.componentRef.setInput('variant', 'outlined');
    fixture.componentRef.setInput('defaultValue', 'query');
    fixture.componentRef.setInput('leadingIcon', '<svg></svg>');
    fixture.detectChanges();

    const label: HTMLLabelElement =
      fixture.nativeElement.querySelector('label');
    expect(label.classList.contains('-left-6')).toBe(true);
    expect(label.classList.contains('left-2')).toBe(false);
  });

  it('opens a menu of options and selects one', () => {
    const changes: string[] = [];
    fixture.componentRef.setInput('type', 'select');
    fixture.componentRef.setInput('options', [
      { value: 'fr', label: 'France' },
      { value: 'de', label: 'Germany' },
    ]);
    fixture.componentInstance.valueChange.subscribe((v) => changes.push(v));
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    input.click();
    fixture.detectChanges();
    // AnchorPositioner portals the popover to document.body, outside fixture.nativeElement.
    const listbox = document.body.querySelector('[role="listbox"]');
    expect(listbox).toBeTruthy();

    const germany = Array.from(
      document.body.querySelectorAll('[role="option"]'),
    ).find((el) => (el as HTMLElement).textContent?.trim() === 'Germany');
    (germany as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    fixture.detectChanges();

    expect(changes).toEqual(['de']);
    expect(document.body.querySelector('[role="listbox"]')).toBeFalsy();
  });

  it('opens a date picker and confirms a selection', () => {
    fixture.componentRef.setInput('type', 'date');
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Choose date"]',
    );
    trigger.click();
    fixture.detectChanges();

    expect(() => findButtonByText(document.body, 'OK')).not.toThrow();
    findButtonByText(document.body, 'Cancel').click();
    fixture.detectChanges();

    expect(findButtonByTextOrNull(document.body, 'OK')).toBeNull();
  });

  it('stays directly typable in date mode -- only select mode is read-only', () => {
    const changes: string[] = [];
    fixture.componentRef.setInput('type', 'date');
    fixture.componentInstance.valueChange.subscribe((v) => changes.push(v));
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    expect(input.readOnly).toBe(false);
    input.value = '2026-08-07';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(changes).toEqual(['2026-08-07']);
  });

  it('rejects non-date characters typed or pasted into a date field', () => {
    const changes: string[] = [];
    fixture.componentRef.setInput('type', 'date');
    fixture.componentRef.setInput('defaultValue', '2026-01-01');
    fixture.componentInstance.valueChange.subscribe((v) => changes.push(v));
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    input.value = 'egrrg';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(input.value).toBe('');

    input.value = 'hello 2026-08-07 world';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(input.value).toBe('2026-08-07');

    expect(changes).toEqual(['', '2026-08-07']);
  });

  it('auto-inserts dashes as the user types digits in sequence', () => {
    const changes: string[] = [];
    fixture.componentRef.setInput('type', 'date');
    fixture.componentInstance.valueChange.subscribe((v) => changes.push(v));
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    for (const digit of '20260807') {
      input.value = input.value + digit;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(input.value).toBe('2026-08-07');
    expect(changes.at(-1)).toBe('2026-08-07');
  });

  it('lets a custom mask override the built-in date mask', () => {
    const changes: string[] = [];
    const digitsOnly = (raw: string) => raw.replace(/\D/g, '').slice(0, 4);
    fixture.componentRef.setInput('type', 'date');
    fixture.componentRef.setInput('mask', digitsOnly);
    fixture.componentInstance.valueChange.subscribe((v) => changes.push(v));
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    input.value = '2026-08-07';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.value).toBe('2026');
    expect(changes).toEqual(['2026']);
  });

  // Idempotent: strips its own literal prefix before extracting digits, so
  // re-running it on its own prior output (as the component does on every
  // keystroke) doesn't re-count "33" as user-entered digits.
  const phoneMask = (raw: string) => {
    const digits = raw.replace(/^\+33/, '').replace(/\D/g, '').slice(0, 9);
    return digits ? `+33${digits}` : '';
  };

  it('applies a custom mask to a non-date field', () => {
    const changes: string[] = [];
    fixture.componentRef.setInput('mask', phoneMask);
    fixture.componentInstance.valueChange.subscribe((v) => changes.push(v));
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    input.value = 'abc612345678xyz';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.value).toBe('+33612345678');
    expect(changes).toEqual(['+33612345678']);
  });

  it('stays stable through incremental typing and backspacing on a prefix-style custom mask', () => {
    const changes: string[] = [];
    fixture.componentRef.setInput('mask', phoneMask);
    fixture.componentInstance.valueChange.subscribe((v) => changes.push(v));
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    for (const digit of '612345678') {
      input.value = input.value + digit;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
    expect(input.value).toBe('+33612345678');

    input.value = input.value.slice(0, -1);
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(input.value).toBe('+3361234567');

    input.value = input.value.slice(0, -1);
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(input.value).toBe('+336123456');
  });

  it('supports two-way value binding', () => {
    const host = TestBed.createComponent(ControlledTextFieldHost);
    host.detectChanges();
    const input: HTMLInputElement = host.nativeElement.querySelector('input');

    input.value = 'x@y.com';
    input.dispatchEvent(new Event('input'));
    host.detectChanges();

    expect(host.componentInstance.value).toBe('x@y.com');
  });

  it('has no automated accessibility violations', async () => {
    fixture.componentRef.setInput('supportingText', 'We never share this');
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
