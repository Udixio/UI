import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Carousel } from './carousel';
import { CarouselItem } from './carousel-item';

// jsdom lacks these; the shared CustomScroll controller needs them to mount.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(globalThis as any).ResizeObserver ??= NoopObserver;
(globalThis as any).IntersectionObserver ??= NoopObserver;

@Component({
  standalone: true,
  imports: [Carousel, CarouselItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-carousel
      [index]="index()"
      [defaultIndex]="defaultIndex()"
      (indexChange)="indexChanges.push($event)"
    >
      @for (label of slides(); track label) {
        <lib-carousel-item>{{ label }}</lib-carousel-item>
      }
    </lib-carousel>
  `,
})
class CarouselTestHost {
  readonly slides = signal(['Slide 1', 'Slide 2', 'Slide 3']);
  readonly index = signal<number | undefined>(undefined);
  readonly defaultIndex = signal(0);
  readonly indexChanges: number[] = [];
}

@Component({
  standalone: true,
  imports: [Carousel, CarouselItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-carousel>
      <lib-carousel-item>Real slide</lib-carousel-item>
      <div>Not a slide</div>
      not-a-slide-text
    </lib-carousel>
  `,
})
class CarouselStrayContentHost {}

const tabIndexes = (fixture: ComponentFixture<CarouselTestHost>) =>
  Array.from(
    fixture.nativeElement.querySelectorAll('[role="group"]'),
  ).map((el) => (el as HTMLElement).getAttribute('tabindex'));

describe('Carousel (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<CarouselTestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarouselTestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(CarouselTestHost);
  });

  it('exposes the carousel region role', () => {
    fixture.detectChanges();
    const region: HTMLElement =
      fixture.nativeElement.querySelector('[role="region"]');
    expect(region).toBeTruthy();
    expect(region.getAttribute('aria-roledescription')).toBe('carousel');
  });

  it('renders only lib-carousel-item children', () => {
    fixture.detectChanges();
    const groups = fixture.nativeElement.querySelectorAll('[role="group"]');
    expect(groups.length).toBe(3);
  });

  it('ignores projected content that is not lib-carousel-item', () => {
    const strayFixture = TestBed.createComponent(CarouselStrayContentHost);
    strayFixture.detectChanges();
    const root: HTMLElement = strayFixture.nativeElement;
    expect(root.textContent).toContain('Real slide');
    expect(root.textContent).not.toContain('Not a slide');
    expect(root.textContent).not.toContain('not-a-slide-text');
    expect(root.querySelectorAll('[role="group"]').length).toBe(1);
  });

  it('gives each slide a group role and an "n / total" accessible name', () => {
    fixture.detectChanges();
    const groups: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[role="group"]'),
    );
    groups.forEach((slide, i) => {
      expect(slide.getAttribute('aria-roledescription')).toBe('slide');
      expect(slide.getAttribute('aria-label')).toBe(`${i + 1} / 3`);
    });
  });

  it('keeps a single slide in the tab order (roving tabindex)', () => {
    fixture.detectChanges();
    expect(tabIndexes(fixture)).toEqual(['0', '-1', '-1']);
  });

  it('does not expose aria-selected on slides', () => {
    fixture.detectChanges();
    const groups: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[role="group"]'),
    );
    for (const slide of groups) {
      expect(slide.hasAttribute('aria-selected')).toBe(false);
    }
  });

  it('seeds the initial selection from defaultIndex when uncontrolled', () => {
    fixture.componentInstance.defaultIndex.set(2);
    fixture.detectChanges();
    expect(tabIndexes(fixture)).toEqual(['-1', '-1', '0']);
  });

  it('renders the controlled index as the source of truth', () => {
    fixture.componentInstance.index.set(1);
    fixture.detectChanges();
    expect(tabIndexes(fixture)).toEqual(['-1', '0', '-1']);
  });

  it('handles arrow-key navigation without throwing', () => {
    fixture.detectChanges();
    const region: HTMLElement =
      fixture.nativeElement.querySelector('[role="region"]');
    expect(() => {
      region.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      region.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
      );
      region.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
      );
      region.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
      );
    }).not.toThrow();
  });

  it('renders an empty carousel without throwing', () => {
    fixture.componentInstance.slides.set([]);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
