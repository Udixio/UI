import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
  type OnInit,
} from '@angular/core';
import {
  carouselStyle,
  customScrollStyle,
  type CarouselInterface,
  type CarouselMetrics,
  type CarouselProps,
  type ClassNameComponent,
} from '@udixio/core';
import {
  createCarouselController,
  createCustomScrollController,
  type CarouselController,
  type CustomScrollController,
} from '@udixio/core/dom';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';
import { CAROUSEL_CONTEXT } from './carousel-context';
import { CarouselItem } from './carousel-item';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Carousels show a collection of items that can be scrolled on and off the screen.
 *
 * @status beta
 * @category Layout
 * @devx Project `udx-carousel-item` children; use `index`/`indexChange` for controlled positioning, or `defaultIndex` to seed the initial position of an uncontrolled carousel.
 * @a11y The root is a `region` with `aria-roledescription="carousel"` (set `accessibleLabel` for a name); each slide is a `group` with `aria-roledescription="slide"` and an `"n / total"` label. Roving `tabindex` keeps a single slide in the tab order; Arrow/Home/End move the selection.
 * @limitations Responsive behavior on mobile is not supported. Only the `hero` variant is implemented; `center-aligned`, `multi-browse`, `un-contained`, and `full-screen` are reserved in the type for future Material 3 layout support and currently render as `hero`.
 */
@Component({
  selector: 'udx-carousel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: CAROUSEL_CONTEXT, useExisting: forwardRef(() => Carousel) },
  ],
  host: { style: 'display: contents' },
  template: `
    <div
      #root
      [class]="styles()['carousel']"
      role="region"
      [attr.aria-label]="accessibleLabel() || null"
      aria-roledescription="carousel"
      (keydown)="handleKeyDown($event)"
    >
      <div #scrollContainer [class]="scrollStyles()['customScroll']">
        <div
          #scrollContent
          [class]="scrollStyles()['track']"
          [style.width.px]="viewportWidth() || null"
        >
          <div
            #track
            [class]="styles()['track']"
            [style.gap.px]="gap()"
            style="will-change: transform"
          >
            <ng-content select="udx-carousel-item" />
          </div>
        </div>

        @if (spacerWidth() > 0) {
          <div class="flex-none" [style.width.px]="spacerWidth()"></div>
        }
      </div>
    </div>
  `,
})
export class Carousel implements OnInit {
  readonly variant = input<CarouselProps['variant']>('hero');
  readonly gap = input(8);
  readonly scrollSensitivity = input(1.25);
  readonly outputRange = input<[number, number]>([42, 300]);
  readonly index = input<number>();
  readonly defaultIndex = input(0);
  /** Accessible name for the carousel region. */
  readonly accessibleLabel = input<string>();
  readonly className = input<string | ClassNameComponent<CarouselInterface>>();

  /** Emits an accepted centered-index transition. */
  readonly indexChange = output<number>();
  /** Receives live metrics to better control the carousel externally. */
  readonly metricsChange = output<CarouselMetrics>();

  private readonly root = viewChild<ElementRef<HTMLElement>>('root');
  private readonly scrollContainer =
    viewChild<ElementRef<HTMLElement>>('scrollContainer');
  private readonly scrollContent =
    viewChild<ElementRef<HTMLElement>>('scrollContent');
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly items = contentChildren(CarouselItem, {
    read: ElementRef<HTMLElement>,
  });

  private readonly indexState = createControllableState({
    value: this.index,
    defaultValue: this.defaultIndex,
    onChange: (value) => this.indexChange.emit(value),
    componentName: 'Carousel',
    stateName: 'index',
  });
  protected readonly selectedIndex = this.indexState.value;

  /** Last index the user explicitly targeted; the keyboard-nav baseline. */
  private readonly focusedIndex = signal(0);
  protected readonly viewportWidth = signal(0);
  private readonly isDragging = signal(false);

  private carouselController?: CarouselController;
  private customScrollController?: CustomScrollController;
  private scrollVisible = 0;
  private lastMetrics: CarouselMetrics | null = null;
  private didMount = false;
  // Index last reported by the DOM controller itself (i.e. the outcome of
  // the user's own scroll/drag), as opposed to one requested externally.
  private lastReportedSelectedIndex: number | undefined;

  protected readonly styles = createStyle(carouselStyle, () => ({
    variant: this.variant(),
    gap: this.gap(),
    scrollSensitivity: this.scrollSensitivity(),
    outputRange: this.outputRange(),
    index: this.index(),
    defaultIndex: this.defaultIndex(),
    onIndexChange: () => undefined,
    onMetricsChange: () => undefined,
    selectedIndex: this.selectedIndex(),
    className: this.className(),
  }));

  protected readonly scrollStyles = createStyle(customScrollStyle, () => ({
    orientation: 'horizontal' as const,
    draggable: true,
    isDragging: this.isDragging(),
    scrollSize: this.computeScrollSize(),
    onScroll: () => undefined,
    scroll: undefined,
    setScroll: () => undefined,
    throttleDuration: 75,
    className: undefined,
  }));

  protected readonly spacerWidth = computed(() =>
    Math.max(0, this.computeScrollSize() - this.viewportWidth()),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Create both shared controllers exactly once, when the DOM first
    // exists, and seed the spring at the resolved initial index instead of
    // an implicit progress of 0 (a nonzero controlled/default index must
    // render correctly from the very first frame, not be corrected a tick
    // later). This intentionally uses afterNextRender, not
    // afterRenderEffect: it must run once and never again, regardless of
    // which signals it happens to read. An effect-based version that reads
    // items()/selectedIndex() (even transitively, e.g. through viewChild
    // re-evaluation) re-runs on later content/selection/resize activity,
    // tearing down and recreating both controllers each time -- which
    // re-triggers notifyInitial()'s setProgress(0) side effect against a
    // controller that had already settled elsewhere, producing a permanent
    // create/destroy oscillation between the initial and resting index.
    afterNextRender(() => {
      const root = this.root()?.nativeElement;
      const container = this.scrollContainer()?.nativeElement;
      const content = this.scrollContent()?.nativeElement;
      const track = this.track()?.nativeElement;
      if (!root || !container || !content || !track) return;

      let carouselController: CarouselController | undefined;

      const customScrollController = createCustomScrollController({
        container,
        content,
        orientation: () => 'horizontal',
        scrollSize: () => this.computeScrollSize(),
        draggable: () => true,
        onScroll: (metrics) => {
          this.scrollVisible = metrics.scrollVisible;
          if (metrics.scrollTotal > 0) {
            carouselController?.setProgress(metrics.scrollProgress ?? 0);
          }
        },
        onDraggingChange: (dragging) => this.isDragging.set(dragging),
        onDimensionsChange: (dimensions) =>
          this.viewportWidth.set(dimensions.width),
      });

      carouselController = createCarouselController({
        track,
        items: () => this.items().map((ref) => ref.nativeElement),
        viewport: () => this.scrollVisible || root.clientWidth || 0,
        gap: () => this.gap(),
        minItemWidth: () => this.outputRange()[0],
        maxItemWidth: () => this.outputRange()[1],
        onSelectedIndexChange: (i) => {
          this.lastReportedSelectedIndex = i;
          this.indexState.set(i);
        },
      });

      this.customScrollController = customScrollController;
      this.carouselController = carouselController;

      // Read the desired initial position BEFORE notifyInitial(), which can
      // synchronously round-trip through onScroll -> setProgress(0) and
      // would otherwise clobber a nonzero resolved index. Re-assert it last
      // so this call always wins regardless of that side effect.
      const count = this.items().length;
      const initialProgress =
        count > 1
          ? clamp01(this.selectedIndex() / Math.max(1, count - 1))
          : 0;
      customScrollController.notifyInitial();
      carouselController.setProgress(initialProgress, { animate: false });

      destroyRef.onDestroy(() => {
        customScrollController.destroy();
        carouselController?.destroy();
        this.customScrollController = undefined;
        this.carouselController = undefined;
      });
    });

    // Re-apply the layout when item count, gap, or size range change.
    afterRenderEffect(() => {
      this.items();
      this.gap();
      this.outputRange();
      this.carouselController?.update();
    });

    // Stamp slide semantics (role/roledescription/label) and wire focus once
    // per item-list change; only the count is a dependency here, so this
    // never re-runs mid-scroll.
    afterRenderEffect((onCleanup) => {
      const elements = this.items().map((ref) => ref.nativeElement);
      const total = elements.length;
      const unlisten = elements.map((element, i) => {
        element.setAttribute('role', 'group');
        element.setAttribute('aria-roledescription', 'slide');
        element.setAttribute('aria-label', `${i + 1} / ${total}`);
        const onFocus = () => this.focusedIndex.set(i);
        element.addEventListener('focus', onFocus);
        return () => element.removeEventListener('focus', onFocus);
      });
      onCleanup(() => unlisten.forEach((off) => off()));
    });

    // Roving tabindex: only the selected slide is in the tab order.
    afterRenderEffect(() => {
      const elements = this.items().map((ref) => ref.nativeElement);
      const selected = this.selectedIndex();
      elements.forEach((element, i) => {
        element.tabIndex = i === selected ? 0 : -1;
      });
    });

    // Re-center only when the controlled `index` input changes to a value
    // the carousel didn't itself just report (the initial position is
    // already seeded above). In controlled usage, our own scroll-driven
    // onSelectedIndexChange notifies the owner, which typically feeds the
    // same value straight back through `index` -- comparing against the
    // resolved `selectedIndex` wouldn't catch that echo (it's already
    // updated too), so a genuine external "jump to N" request was
    // indistinguishable from our own scroll confirming it arrived at N,
    // and every step of a free scroll re-triggered an instant scrollTo
    // against the position the user was still actively dragging through.
    afterRenderEffect(() => {
      const idx = this.index();
      const count = this.items().length;
      if (count === 0) return;
      if (!this.didMount) {
        this.didMount = true;
        return;
      }
      if (typeof idx === 'number' && idx !== this.lastReportedSelectedIndex) {
        this.centerOnIndex(idx);
      }
    });

    afterRenderEffect(() => {
      const total = this.items().length;
      const root = this.root()?.nativeElement;
      if (total <= 0 || !root) return;

      const viewportWidth = root.clientWidth || 0;
      const gap = this.gap();
      const itemMaxWidth = this.outputRange()[1];
      const scrollProgress = this.carouselController?.getProgress() ?? 0;
      const visibleApprox = (viewportWidth + gap) / (itemMaxWidth + gap);
      const visibleFull = Math.max(1, Math.floor(visibleApprox));
      const stepHalf = Math.max(1, Math.round(visibleFull * (2 / 3)));
      const selectedIndexSafe = Math.min(
        Math.max(0, this.selectedIndex()),
        Math.max(0, total - 1),
      );

      const metrics: CarouselMetrics = {
        total,
        selectedIndex: selectedIndexSafe,
        visibleApprox,
        visibleFull,
        stepHalf,
        canPrev: selectedIndexSafe > 0,
        canNext: selectedIndexSafe < total - 1,
        scrollProgress,
        viewportWidth,
        itemMaxWidth,
        gap,
      };

      const last = this.lastMetrics;
      const changed =
        !last ||
        (Object.keys(metrics) as (keyof CarouselMetrics)[]).some(
          (key) => metrics[key] !== last[key],
        );
      if (changed) {
        this.lastMetrics = metrics;
        this.metricsChange.emit(metrics);
      }
    });
  }

  ngOnInit(): void {
    this.indexState.initialize();
  }

  private computeScrollSize(): number {
    let maxWidth = this.outputRange()[1];
    const visible = this.viewportWidth();
    if (visible > 0 && maxWidth > visible) {
      maxWidth = visible;
    }
    const result =
      ((maxWidth + this.gap()) * this.items().length) /
      this.scrollSensitivity();
    return result || 400;
  }

  private centerOnIndex(idx: number): void {
    const count = this.items().length;
    if (count === 0) return;
    this.focusedIndex.set(idx);
    this.customScrollController?.scrollTo({
      progress: clamp01(idx / Math.max(1, count - 1)),
      orientation: 'horizontal',
    });
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    const count = this.items().length;
    if (count === 0) return;
    const idx = this.focusedIndex();
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.centerOnIndex(Math.max(0, idx - 1));
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.centerOnIndex(Math.min(count - 1, idx + 1));
        break;
      case 'Home':
        event.preventDefault();
        this.centerOnIndex(0);
        break;
      case 'End':
        event.preventDefault();
        this.centerOnIndex(count - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.centerOnIndex(idx);
        break;
    }
  }
}
