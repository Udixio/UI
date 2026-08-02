import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { animate } from 'motion';
import { Slider } from './slider';

expect.extend(toHaveNoViolations);

// The value-indicator show/hide is a real Motion JS animation owned by
// `createSliderIndicatorController` (core/dom) and already unit-tested
// there; here we only need to verify the Angular wiring requests the right
// visibility, not exercise jsdom's lack of a real WAAPI implementation.
jest.mock('motion', () => ({ animate: jest.fn(() => ({ stop: jest.fn() })) }));

function stubTrackWidth(track: HTMLElement, width = 200) {
  track.getBoundingClientRect = () =>
    ({ left: 0, width, top: 0, height: 44, right: width, bottom: 44 }) as DOMRect;
  Object.defineProperty(track, 'offsetWidth', {
    value: width,
    configurable: true,
  });
}

@Component({
  standalone: true,
  imports: [Slider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lib-slider
    name="volume"
    [(value)]="value"
    [step]="10"
    aria-label="Volume"
  />`,
})
class ControlledSliderHost {
  value = 20;
}

describe('Slider (Angular)', () => {
  let fixture: ComponentFixture<Slider>;

  async function createFixture() {
    await TestBed.configureTestingModule({ imports: [Slider] }).compileComponents();
    // Do NOT call detectChanges() here: ngOnInit (which captures the
    // uncontrolled default) must run only after every input the test cares
    // about, notably `defaultValue`, has already been set.
    return TestBed.createComponent(Slider);
  }

  it('renders with default ARIA attributes', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('name', 'volume');
    fixture.componentRef.setInput('defaultValue', 30);
    fixture.componentRef.setInput('step', 10);
    fixture.detectChanges();

    const track: HTMLElement = fixture.nativeElement.querySelector(
      '[role="slider"]',
    );
    expect(track.getAttribute('aria-valuemin')).toBe('0');
    expect(track.getAttribute('aria-valuemax')).toBe('100');
    expect(track.getAttribute('aria-valuenow')).toBe('30');
    expect(track.getAttribute('tabindex')).toBe('0');
    expect(track.hasAttribute('aria-disabled')).toBe(false);
  });

  it('has no accessibility violations', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('name', 'volume');
    fixture.componentRef.setInput('defaultValue', 30);
    fixture.componentRef.setInput('aria-label', 'Volume');
    fixture.detectChanges();

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });

  it('owns uncontrolled state and drags to a snapped value', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('name', 'volume');
    fixture.componentRef.setInput('defaultValue', 0);
    fixture.componentRef.setInput('step', 10);
    const changes: number[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => changes.push(v));
    fixture.detectChanges();

    const track: HTMLElement = fixture.nativeElement.querySelector(
      '[role="slider"]',
    );
    stubTrackWidth(track);

    track.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 100, bubbles: true }),
    );
    fixture.detectChanges();
    expect(track.getAttribute('aria-valuenow')).toBe('50');

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 180 }));
    fixture.detectChanges();
    expect(track.getAttribute('aria-valuenow')).toBe('90');

    window.dispatchEvent(new MouseEvent('mouseup'));
    expect(changes).toEqual([50, 90]);
  });

  it('requests controlled changes via [(value)] without a stale echo', async () => {
    const hostFixture = TestBed.configureTestingModule({
      imports: [ControlledSliderHost],
    });
    await hostFixture.compileComponents();
    const host = TestBed.createComponent(ControlledSliderHost);
    host.detectChanges();

    const track: HTMLElement = host.nativeElement.querySelector(
      '[role="slider"]',
    );
    stubTrackWidth(track);

    track.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 100, bubbles: true }),
    );
    host.detectChanges();

    expect(host.componentInstance.value).toBe(50);
    expect(track.getAttribute('aria-valuenow')).toBe('50');
  });

  it('moves by one step on ArrowRight/ArrowLeft and snaps to bounds on Home/End', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('name', 'volume');
    fixture.componentRef.setInput('defaultValue', 50);
    fixture.componentRef.setInput('step', 10);
    fixture.detectChanges();

    const track: HTMLElement = fixture.nativeElement.querySelector(
      '[role="slider"]',
    );

    track.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(track.getAttribute('aria-valuenow')).toBe('60');

    track.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    fixture.detectChanges();
    expect(track.getAttribute('aria-valuenow')).toBe('100');

    track.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    );
    fixture.detectChanges();
    expect(track.getAttribute('aria-valuenow')).toBe('0');
  });

  it('shows the value indicator during keyboard use, then hides it after inactivity or blur', async () => {
    jest.mocked(animate).mockClear();
    jest.useFakeTimers();
    fixture = await createFixture();
    fixture.componentRef.setInput('name', 'volume');
    fixture.componentRef.setInput('defaultValue', 50);
    fixture.componentRef.setInput('step', 10);
    fixture.detectChanges();

    const track: HTMLElement = fixture.nativeElement.querySelector(
      '[role="slider"]',
    );
    const indicator: HTMLElement = track.querySelector('.handle > div > div')!;

    expect(animate).not.toHaveBeenCalled();

    track.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(animate).toHaveBeenLastCalledWith(
      indicator,
      { scale: 1 },
      { duration: 0.1 },
    );

    jest.advanceTimersByTime(1499);
    fixture.detectChanges();
    expect(animate).toHaveBeenLastCalledWith(
      indicator,
      { scale: 1 },
      { duration: 0.1 },
    );
    jest.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(animate).toHaveBeenLastCalledWith(
      indicator,
      { scale: 0 },
      { duration: 0.1 },
    );

    track.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(animate).toHaveBeenLastCalledWith(
      indicator,
      { scale: 1 },
      { duration: 0.1 },
    );
    track.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(animate).toHaveBeenLastCalledWith(
      indicator,
      { scale: 0 },
      { duration: 0.1 },
    );

    jest.useRealTimers();
  });

  it('blocks pointer and keyboard interaction while disabled', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('name', 'volume');
    fixture.componentRef.setInput('defaultValue', 50);
    fixture.componentRef.setInput('step', 10);
    fixture.componentRef.setInput('disabled', true);
    const changes: number[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => changes.push(v));
    fixture.detectChanges();

    const track: HTMLElement = fixture.nativeElement.querySelector(
      '[role="slider"]',
    );
    stubTrackWidth(track);

    expect(track.getAttribute('aria-disabled')).toBe('true');
    expect(track.getAttribute('tabindex')).toBe('-1');

    track.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 190, bubbles: true }),
    );
    track.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();

    expect(changes).toEqual([]);
    expect(track.getAttribute('aria-valuenow')).toBe('50');
  });

  it('snaps to the nearest mark when no step is given', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('name', 'percent');
    fixture.componentRef.setInput('defaultValue', 25);
    fixture.componentRef.setInput('marks', [
      { value: 0, label: '0' },
      { value: 25, label: '25' },
      { value: 50, label: '50' },
      { value: 75, label: '75' },
      { value: 100, label: '100' },
    ]);
    fixture.detectChanges();

    const track: HTMLElement = fixture.nativeElement.querySelector(
      '[role="slider"]',
    );
    stubTrackWidth(track);

    track.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 130, bubbles: true }),
    );
    fixture.detectChanges();
    expect(track.getAttribute('aria-valuenow')).toBe('75');
  });

  it('exposes the resolved value through a hidden form input', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('name', 'volume');
    fixture.componentRef.setInput('defaultValue', 40);
    fixture.detectChanges();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input[type="hidden"]');
    expect(input.name).toBe('volume');
    expect(input.value).toBe('40');
  });
});
