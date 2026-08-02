import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Snackbar } from './snackbar';

expect.extend(toHaveNoViolations);

describe('Snackbar (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<Snackbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Snackbar],
    }).compileComponents();
    fixture = TestBed.createComponent(Snackbar);
    fixture.componentRef.setInput('message', 'Saved');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('owns an uncontrolled open state and emits each accepted transition once', () => {
    const changes: boolean[] = [];
    fixture.componentInstance.openChange.subscribe((open) =>
      changes.push(open),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Saved');
    const closeButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    closeButton.click();
    fixture.detectChanges();

    expect(changes).toEqual([false]);
  });

  it('starts closed when defaultOpen is false', () => {
    fixture.componentRef.setInput('defaultOpen', false);
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('[role="status"]');
    expect(status.getAttribute('aria-hidden')).toBe('true');
    expect(status.hasAttribute('inert')).toBe(true);
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
    expect(fixture.nativeElement.textContent).toContain('Saved');
  });

  it('renders only after the controlled owner updates open', () => {
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('[role="status"]')
        .getAttribute('aria-hidden'),
    ).toBe('true');

    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Saved');
    expect(
      fixture.nativeElement
        .querySelector('[role="status"]')
        .getAttribute('aria-hidden'),
    ).toBe('false');
  });

  it('auto-dismisses once after duration elapses', () => {
    jest.useFakeTimers();
    const changes: boolean[] = [];
    fixture.componentInstance.openChange.subscribe((open) =>
      changes.push(open),
    );
    fixture.componentRef.setInput('duration', 1000);
    fixture.detectChanges();

    jest.advanceTimersByTime(999);
    fixture.detectChanges();
    expect(changes).toEqual([]);

    jest.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(changes).toEqual([false]);
  });

  it('cancels the pending auto-dismiss when destroyed', () => {
    jest.useFakeTimers();
    const changes: boolean[] = [];
    fixture.componentInstance.openChange.subscribe((open) =>
      changes.push(open),
    );
    fixture.componentRef.setInput('duration', 1000);
    fixture.detectChanges();

    fixture.destroy();
    jest.advanceTimersByTime(1000);
    expect(changes).toEqual([]);
  });

  it('renders role="status" and aria-live="polite"', () => {
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('exposes the resolved open state to a state-aware className function', () => {
    fixture.componentRef.setInput(
      'className',
      (state: { isOpen: boolean }) => ({
        snackbar: state.isOpen ? 'is-open' : 'is-closed',
      }),
    );
    fixture.detectChanges();
    const snackbar = fixture.nativeElement.querySelector('.bg-inverse-surface');
    expect(snackbar.className).toContain('is-open');
  });

  it('has no automated accessibility violations', async () => {
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
