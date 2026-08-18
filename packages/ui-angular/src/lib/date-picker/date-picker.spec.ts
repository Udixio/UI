import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { DateRange } from '@udixio/core';
import { DatePicker } from './date-picker';

expect.extend(toHaveNoViolations);

const playMonthTransition = jest.fn();

jest.mock('@udixio/core/dom', () => ({
  ...jest.requireActual('@udixio/core/dom'),
  createMonthTransitionController: () => ({
    play: playMonthTransition,
    destroy: jest.fn(),
  }),
}));

function dayButton(
  fixture: ComponentFixture<DatePicker>,
  day: number,
): HTMLButtonElement {
  const buttons = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '[role="gridcell"] button',
    ),
  );
  const match = buttons.find((button) => button.textContent?.trim() === String(day));
  if (!match) throw new Error(`No day button found for ${day}`);
  return match;
}

function gridCellOf(button: HTMLButtonElement): HTMLElement {
  return button.parentElement as HTMLElement;
}

describe('DatePicker (Angular)', () => {
  let fixture: ComponentFixture<DatePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DatePicker] }).compileComponents();
    fixture = TestBed.createComponent(DatePicker);
  });

  afterEach(() => {
    jest.useRealTimers();
    playMonthTransition.mockClear();
  });

  it('owns an uncontrolled value and emits each accepted selection once', () => {
    const changes: unknown[] = [];
    fixture.componentRef.setInput('defaultValue', new Date(2024, 5, 1));
    fixture.componentInstance.valueChange.subscribe((value) => changes.push(value));
    fixture.detectChanges();

    dayButton(fixture, 15).click();
    fixture.detectChanges();

    expect(changes).toHaveLength(1);
    expect((changes[0] as Date).getDate()).toBe(15);
    expect(gridCellOf(dayButton(fixture, 15)).getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('requests a controlled change without mutating the rendered value', () => {
    const changes: unknown[] = [];
    fixture.componentRef.setInput('value', new Date(2024, 5, 1));
    fixture.componentInstance.valueChange.subscribe((value) => changes.push(value));
    fixture.detectChanges();

    dayButton(fixture, 15).click();
    fixture.detectChanges();

    expect(changes).toHaveLength(1);
    expect(gridCellOf(dayButton(fixture, 1)).getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(gridCellOf(dayButton(fixture, 15)).getAttribute('aria-selected')).toBe(
      'false',
    );
  });

  it('reflects a controlled owner update', () => {
    fixture.componentRef.setInput('value', new Date(2024, 5, 1));
    fixture.detectChanges();

    fixture.componentRef.setInput('value', new Date(2024, 5, 20));
    fixture.detectChanges();

    expect(gridCellOf(dayButton(fixture, 20)).getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('blocks a transition to a disabled day and does not emit', () => {
    const changes: unknown[] = [];
    fixture.componentRef.setInput('defaultValue', new Date(2024, 5, 15));
    fixture.componentRef.setInput('minDate', new Date(2024, 5, 10));
    fixture.componentInstance.valueChange.subscribe((value) => changes.push(value));
    fixture.detectChanges();

    const disabledDay = dayButton(fixture, 5);
    expect(disabledDay.getAttribute('aria-disabled')).toBe('true');

    disabledDay.click();
    fixture.detectChanges();
    expect(changes).toHaveLength(0);
  });

  it('does not disable the minDate day itself when minDate carries a time-of-day', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 5, 15, 9, 30));
    fixture.componentRef.setInput('minDate', new Date(2024, 5, 15, 14, 0));
    fixture.detectChanges();

    const today = dayButton(fixture, 15);
    expect(today.getAttribute('aria-disabled')).not.toBe('true');
  });

  it('resolves a single deterministic variant when a day is both selected and today', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 5, 15));
    fixture.componentRef.setInput('defaultValue', new Date(2024, 5, 15));
    fixture.detectChanges();

    const day = dayButton(fixture, 15);
    expect(day.className).toContain('bg-primary');
    expect(day.getAttribute('aria-current')).toBe('date');
  });

  it('exposes hasSelected to the className state contract', () => {
    const states: boolean[] = [];
    fixture.componentRef.setInput('className', (state: { hasSelected: boolean }) => {
      states.push(state.hasSelected);
      return {};
    });
    fixture.detectChanges();

    dayButton(fixture, 10).click();
    fixture.detectChanges();

    expect(states[0]).toBe(false);
    expect(states.at(-1)).toBe(true);
  });

  it('applies the monthNav/monthLabel/dayButton style keys', () => {
    fixture.componentRef.setInput('defaultValue', new Date(2024, 5, 1));
    fixture.componentRef.setInput('locale', 'en-US');
    fixture.detectChanges();

    const prevMonth: HTMLElement = fixture.nativeElement.querySelector(
      '[aria-label="Previous month"]',
    );
    // prevMonth's DOM parent is <udx-icon-button>'s own host element; the
    // monthNav container is one level further up.
    const monthNav = prevMonth.parentElement?.parentElement;
    expect(monthNav?.className).toContain('flex');
    expect(monthNav?.className).toContain('items-center');

    const headerButton = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((button) => (button as HTMLElement).textContent?.includes('June 2024')) as
      | HTMLElement
      | undefined;
    expect(headerButton?.className).toContain('text-label-large');
    expect(headerButton?.className).toContain('font-bold');
    expect(headerButton?.className).toContain('capitalize');

    expect(dayButton(fixture, 10).className).toContain('rounded-full');
  });

  it('completes a range in chronological order regardless of click order', () => {
    const changes: DateRange[] = [];
    fixture.componentRef.setInput('mode', 'range');
    fixture.componentInstance.valueChange.subscribe((value) =>
      changes.push(value as DateRange),
    );
    fixture.detectChanges();

    dayButton(fixture, 20).click();
    fixture.detectChanges();
    dayButton(fixture, 10).click();
    fixture.detectChanges();

    const [start, end] = changes.at(-1)!;
    expect(start!.getDate()).toBe(10);
    expect(end!.getDate()).toBe(20);
    expect(gridCellOf(dayButton(fixture, 15)).getAttribute('aria-selected')).toBe(
      'false',
    );
  });

  it('exposes the calendar as a grid with row/gridcell roles', () => {
    fixture.componentRef.setInput('defaultValue', new Date(2024, 5, 1));
    fixture.componentRef.setInput('locale', 'en-US');
    fixture.detectChanges();

    const grid: HTMLElement = fixture.nativeElement.querySelector('[role="grid"]');
    expect(grid.getAttribute('aria-label')).toMatch(/June 2024/i);
    expect(fixture.nativeElement.querySelectorAll('[role="row"]').length).toBeGreaterThan(1);
    expect(
      fixture.nativeElement.querySelectorAll('[role="gridcell"]').length,
    ).toBeGreaterThan(0);
    expect(
      fixture.nativeElement.querySelectorAll('[role="columnheader"]'),
    ).toHaveLength(7);
  });

  it('moves the roving tabIndex and focus with ArrowRight', () => {
    fixture.componentRef.setInput('defaultValue', new Date(2024, 5, 10));
    fixture.detectChanges();

    const day10 = dayButton(fixture, 10);
    const day11 = dayButton(fixture, 11);
    expect(day10.tabIndex).toBe(0);
    expect(day11.tabIndex).toBe(-1);

    day10.focus();
    day10.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();

    expect(dayButton(fixture, 11).tabIndex).toBe(0);
    expect(dayButton(fixture, 10).tabIndex).toBe(-1);
    expect(document.activeElement).toBe(dayButton(fixture, 11));
  });

  it('changes month with PageDown and keeps focus on the grid', async () => {
    fixture.componentRef.setInput('defaultValue', new Date(2024, 5, 10));
    fixture.componentRef.setInput('locale', 'en-US');
    fixture.detectChanges();

    const day10 = dayButton(fixture, 10);
    day10.focus();
    day10.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }),
    );
    fixture.detectChanges();
    // Crossing a month boundary destroys/recreates the day-button DOM nodes
    // via @for; the focus-restoring afterRenderEffect is a render hook that
    // runs outside NgZone, so it needs an explicit TestBed.tick() flush, plus
    // one macrotask for the component's own same-tick retry fallback.
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));

    const grid: HTMLElement = fixture.nativeElement.querySelector('[role="grid"]');
    expect(grid.getAttribute('aria-label')).toMatch(/July 2024/i);
    expect(document.activeElement).toBe(dayButton(fixture, 10));
  });

  it('plays the shared month-transition animation in the direction of navigation', () => {
    fixture.componentRef.setInput('defaultValue', new Date(2024, 5, 10));
    fixture.detectChanges();
    expect(playMonthTransition).toHaveBeenCalledWith(0); // mount, no transition

    playMonthTransition.mockClear();
    const nextMonth: HTMLElement = fixture.nativeElement.querySelector(
      '[aria-label="Next month"]',
    );
    nextMonth.click();
    fixture.detectChanges();
    expect(playMonthTransition).toHaveBeenCalledWith(1);

    playMonthTransition.mockClear();
    const prevMonth: HTMLElement = fixture.nativeElement.querySelector(
      '[aria-label="Previous month"]',
    );
    prevMonth.click();
    fixture.detectChanges();
    expect(playMonthTransition).toHaveBeenCalledWith(-1);
  });

  it('scrolls the selected year list to the year button, not the <udx-button> host', async () => {
    // Regression: `data-selected` lives on <udx-button>, whose host renders
    // with `display: contents` and has no box; scrollIntoView must target
    // its native <button> descendant or the call is a silent no-op.
    // jsdom does not implement scrollIntoView; stub it before spying.
    HTMLElement.prototype.scrollIntoView ??= () => undefined;
    const scrollIntoView = jest
      .spyOn(HTMLElement.prototype, 'scrollIntoView')
      .mockImplementation(() => undefined);
    fixture.componentRef.setInput('defaultValue', new Date(2024, 5, 10));
    fixture.detectChanges();

    const headerButton: HTMLElement =
      fixture.nativeElement.querySelector('.month-label');
    headerButton.click();
    fixture.detectChanges();
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));

    expect(scrollIntoView).toHaveBeenCalled();
    // `scrollIntoView` declares no `this`, so jest types the recorded
    // instances as `void`; the call target really is the element.
    const target = scrollIntoView.mock.instances[0] as unknown as HTMLElement;
    expect(target.tagName).toBe('BUTTON');
    expect(target.textContent?.trim()).toBe('2024');

    scrollIntoView.mockRestore();
  });

  it('has no automated accessibility violations', async () => {
    fixture.componentRef.setInput('defaultValue', new Date(2024, 5, 1));
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
