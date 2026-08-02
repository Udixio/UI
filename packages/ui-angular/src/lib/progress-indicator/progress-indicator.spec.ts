import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import type {
  ClassNameComponent,
  ProgressIndicatorInterface,
} from '@udixio/core';
import { ProgressIndicator } from './progress-indicator';

expect.extend(toHaveNoViolations);

describe('ProgressIndicator (Angular)', () => {
  let fixture: ComponentFixture<ProgressIndicator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressIndicator],
    }).compileComponents();
    fixture = TestBed.createComponent(ProgressIndicator);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exposes role="progressbar" with aria-valuenow for determinate variants', () => {
    fixture.componentRef.setInput('variant', 'linear-determinate');
    fixture.componentRef.setInput('value', 40);
    fixture.componentRef.setInput('aria-label', 'Upload progress');
    fixture.detectChanges();
    const progressbar: HTMLElement = fixture.nativeElement.querySelector(
      '[role="progressbar"]',
    );

    expect(progressbar.getAttribute('aria-label')).toBe('Upload progress');
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('40');
  });

  it('clamps out-of-range values before exposing aria-valuenow', () => {
    fixture.componentRef.setInput('variant', 'circular-determinate');
    fixture.componentRef.setInput('value', 140);
    fixture.detectChanges();
    let progressbar: SVGElement = fixture.nativeElement.querySelector(
      '[role="progressbar"]',
    );
    expect(progressbar.getAttribute('aria-valuenow')).toBe('100');

    fixture.componentRef.setInput('value', -10);
    fixture.detectChanges();
    progressbar = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('omits aria-valuenow for indeterminate variants', () => {
    fixture.componentRef.setInput('variant', 'linear-indeterminate');
    fixture.detectChanges();
    const progressbar: HTMLElement = fixture.nativeElement.querySelector(
      '[role="progressbar"]',
    );

    expect(progressbar.hasAttribute('aria-valuenow')).toBe(false);
  });

  it('hides transitionDuration ms after the value reaches 100', () => {
    jest.useFakeTimers();
    const visibilityStates: boolean[] = [];
    const className: ClassNameComponent<ProgressIndicatorInterface> = (
      state,
    ) => {
      visibilityStates.push(state.isVisible);
      return {};
    };

    fixture.componentRef.setInput('variant', 'linear-determinate');
    fixture.componentRef.setInput('value', 40);
    fixture.componentRef.setInput('transitionDuration', 500);
    fixture.componentRef.setInput('className', className);
    fixture.detectChanges();
    expect(visibilityStates.at(-1)).toBe(true);

    fixture.componentRef.setInput('value', 100);
    fixture.detectChanges();
    expect(visibilityStates.at(-1)).toBe(true);

    jest.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(visibilityStates.at(-1)).toBe(false);
  });

  it('stays visible while the value is below 100', () => {
    jest.useFakeTimers();
    const visibilityStates: boolean[] = [];
    const className: ClassNameComponent<ProgressIndicatorInterface> = (
      state,
    ) => {
      visibilityStates.push(state.isVisible);
      return {};
    };

    fixture.componentRef.setInput('variant', 'linear-determinate');
    fixture.componentRef.setInput('value', 40);
    fixture.componentRef.setInput('transitionDuration', 500);
    fixture.componentRef.setInput('className', className);
    fixture.detectChanges();

    jest.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(visibilityStates.at(-1)).toBe(true);
  });

  it('exposes complete style state to state-aware classes', () => {
    const states: Array<Record<string, unknown>> = [];
    const className: ClassNameComponent<ProgressIndicatorInterface> = (
      state,
    ) => {
      states.push(state as unknown as Record<string, unknown>);
      return {};
    };

    fixture.componentRef.setInput('variant', 'linear-determinate');
    fixture.componentRef.setInput('value', 40);
    fixture.componentRef.setInput('minHeight', 4);
    fixture.componentRef.setInput('className', className);
    fixture.detectChanges();

    expect(states.at(-1)).toEqual(
      expect.objectContaining({
        variant: 'linear-determinate',
        value: 40,
        minHeight: 4,
      }),
    );
  });

  it('has no automated accessibility violations', async () => {
    fixture.componentRef.setInput('variant', 'linear-determinate');
    fixture.componentRef.setInput('value', 40);
    fixture.componentRef.setInput('aria-label', 'Upload progress');
    fixture.detectChanges();

    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
