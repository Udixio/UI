import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import * as coreDom from '@udixio/core/dom';
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
    <udx-carousel
      [index]="index()"
      [defaultIndex]="defaultIndex()"
      (indexChange)="indexChanges.push($event)"
    >
      @for (label of slides(); track label) {
        <udx-carousel-item>{{ label }}</udx-carousel-item>
      }
    </udx-carousel>
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
    <udx-carousel>
      <udx-carousel-item>Real slide</udx-carousel-item>
      <div>Not a slide</div>
      not-a-slide-text
    </udx-carousel>
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

  it('renders only udx-carousel-item children', () => {
    fixture.detectChanges();
    const groups = fixture.nativeElement.querySelectorAll('[role="group"]');
    expect(groups.length).toBe(3);
  });

  it('ignores projected content that is not udx-carousel-item', () => {
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

  it('sizes the slide element itself, not a wrapper div', () => {
    // Regression test: CarouselItem previously hosted `display: contents`
    // wrapping a separate styled div, so the parent's DOM controller (which
    // queries contentChildren host elements) wrote --carousel-item-width and
    // display onto a transparent element instead of the real flex item,
    // corrupting the flex layout while leaving DOM attributes looking fine.
    fixture.detectChanges();
    const slide = fixture.nativeElement.querySelector(
      '[role="group"]',
    ) as HTMLElement;
    expect(slide.style.getPropertyValue('--carousel-item-width')).toMatch(
      /px$/,
    );
    expect(slide.style.maxWidth).toBe('300px');
    expect(slide.style.minWidth).toBe('42px');
    expect(slide.querySelector('div')).toBeNull();
    expect(slide.textContent?.trim()).toBe('Slide 1');
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

describe('Carousel resize/mount stability', () => {
  // Regression test: the controller-creation effect used to be an
  // afterRenderEffect that (transitively, through viewChild/contentChildren
  // re-evaluation) re-ran whenever the ResizeObserver reported the
  // container's real dimensions. Each re-run destroyed and recreated both
  // controllers, and notifyInitial()'s setProgress(0) side effect fought
  // whatever index the previous (still-live) controller had already
  // settled at -- producing, in a real browser, an unbounded
  // indexChange(0), indexChange(N), indexChange(0), ... loop and a carousel
  // that could never be scrolled away from its start. NoopObserver in the
  // specs above never actually invokes its callback, so it could not catch
  // this; this fires a realistic async resize to reproduce the real
  // environment, and asserts on controller creation/destruction directly
  // rather than on emitted values, since exactly which index a recreated
  // controller happens to settle on is incidental to the real defect.
  class ControllableObserver {
    constructor(private cb: ResizeObserverCallback) {}
    observe(target: Element) {
      queueMicrotask(() => {
        this.cb(
          [
            {
              target,
              contentRect: { width: 1216, height: 400 },
            } as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver,
        );
      });
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  @Component({
    standalone: true,
    imports: [Carousel, CarouselItem],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <udx-carousel (indexChange)="log.push($event)">
        @for (i of items; track i) {
          <udx-carousel-item>Slide {{ i }}</udx-carousel-item>
        }
      </udx-carousel>
    `,
  })
  class ResizingGalleryHost {
    readonly items = Array.from({ length: 15 }, (_, i) => i + 1);
    readonly log: number[] = [];
  }

  let originalResizeObserver: typeof ResizeObserver;

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver;
    (globalThis as any).ResizeObserver = ControllableObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('creates the shared controllers exactly once despite repeated resize activity', fakeAsync(() => {
    const createCarouselSpy = jest.spyOn(coreDom, 'createCarouselController');
    const createScrollSpy = jest.spyOn(coreDom, 'createCustomScrollController');

    TestBed.configureTestingModule({
      imports: [ResizingGalleryHost],
    }).compileComponents();
    const fixture: ComponentFixture<ResizingGalleryHost> =
      TestBed.createComponent(ResizingGalleryHost);
    fixture.detectChanges();

    const root: HTMLElement =
      fixture.nativeElement.querySelector('[role="region"]');
    Object.defineProperty(root, 'clientWidth', {
      value: 1216,
      configurable: true,
    });
    const container = root.querySelector(':scope > div') as HTMLElement;
    Object.defineProperty(container, 'clientWidth', {
      value: 1216,
      configurable: true,
    });

    // Let the async ResizeObserver firing (and anything it triggers) settle
    // over many change-detection cycles, matching sustained real-world
    // activity rather than a single tick.
    for (let i = 0; i < 20; i++) {
      tick(100);
      fixture.detectChanges();
    }

    expect(createCarouselSpy).toHaveBeenCalledTimes(1);
    expect(createScrollSpy).toHaveBeenCalledTimes(1);
    // A settled, uncontrolled carousel resting at its own initial index
    // never needs to notify -- any emission here would mean something
    // (re)triggered the resolved index away from its starting value.
    expect(fixture.componentInstance.log).toEqual([]);

    createCarouselSpy.mockRestore();
    createScrollSpy.mockRestore();
  }));
});

describe('Carousel controlled index echo', () => {
  // Regression test for a real "with navigation buttons" style usage: the
  // consumer feeds indexChange straight back into index (`[index]="index()"`
  // + `(indexChange)="index.set($event)"`), which is the ordinary way to
  // controll a carousel. The scroll-driven index change previously could
  // not be told apart from a genuine external "jump to N" request, so
  // every step of a free scroll re-triggered an instant, unrequested
  // scrollTo against the position the user was still actively dragging
  // through -- visible as a periodic freeze/snap during any scroll.
  @Component({
    standalone: true,
    imports: [Carousel, CarouselItem],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <udx-carousel [index]="index()" (indexChange)="index.set($event)">
        @for (i of items; track i) {
          <udx-carousel-item>Slide {{ i }}</udx-carousel-item>
        }
      </udx-carousel>
    `,
  })
  class EchoingControlledHost {
    readonly items = Array.from({ length: 15 }, (_, i) => i + 1);
    readonly index = signal(0);
  }

  it('does not re-scroll when a scroll-driven index is echoed back through the controlled input', () => {
    const createCarouselSpy = jest.spyOn(coreDom, 'createCarouselController');
    const createScrollSpy = jest.spyOn(coreDom, 'createCustomScrollController');

    TestBed.configureTestingModule({
      imports: [EchoingControlledHost],
    }).compileComponents();
    const fixture: ComponentFixture<EchoingControlledHost> =
      TestBed.createComponent(EchoingControlledHost);
    fixture.detectChanges();

    const scrollController = createScrollSpy.mock.results[0].value;
    const scrollToSpy = jest.spyOn(scrollController, 'scrollTo');
    const onSelectedIndexChange =
      createCarouselSpy.mock.calls[0][0].onSelectedIndexChange!;

    // Simulate the DOM controller detecting that free scrolling arrived at
    // index 4 -- this notifies the owner, which (per the template above)
    // echoes it straight back as the new `index` input.
    onSelectedIndexChange(4);
    fixture.detectChanges();

    expect(fixture.componentInstance.index()).toBe(4);
    expect(scrollToSpy).not.toHaveBeenCalled();

    // A genuinely external request (e.g. a "Next" button setting an index
    // the carousel did not just report itself) must still work.
    fixture.componentInstance.index.set(9);
    fixture.detectChanges();

    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ orientation: 'horizontal' }),
    );

    createCarouselSpy.mockRestore();
    createScrollSpy.mockRestore();
  });
});
