import {
  Directive,
  ElementRef,
  HostListener,
  afterRenderEffect,
  inject,
  input,
  output,
  untracked,
  type OnDestroy,
} from '@angular/core';
import {
  gesturesModule,
  hasNoBox,
  loadGestures,
  motionBox,
  onGestureDefined,
  resolveGesture,
  type GestureBinding,
  type GestureOptions,
  type GestureRef,
} from '@udixio/motion';

/**
 * Binds a gesture to an element now, or as soon as the named gesture is defined, once the gestures module is loaded: until
 * then the element is not touched, so a render never throws because of a gesture. An element declared with no box moves its
 * box, so the gesture is bound again when a new box is rendered in place of the old one, as the motions and the HTML scanner
 * are. Returns the function that destroys the binding.
 */
function bindGestureWhenDefined(
  target: HTMLElement,
  source: GestureRef | string,
  options: GestureOptions,
  onBound: (binding: GestureBinding) => void,
): () => void {
  let binding: GestureBinding | undefined;
  let stopWaiting: (() => void) | undefined;
  let cancelled = false;
  // The gesture moves the box it found when it bound: `box` is that box, and `watcher` binds again when it is another one.
  let bound: GestureRef | string = source;
  let box: Element | undefined;
  let watcher: MutationObserver | undefined;
  const followBox = () => {
    if (cancelled || !binding || motionBox(target) === box) return;
    binding.destroy();
    binding = undefined;
    bind(bound);
  };
  const bind = (ref: GestureRef | string) => {
    const api = gesturesModule();
    if (!api) {
      // The module loads once per page; a binding released before it arrives never binds.
      void loadGestures().then(
        () => {
          if (!cancelled) bind(ref);
        },
        () => {},
      );
      return;
    }
    bound = ref;
    binding = api.gesture(target, ref, options);
    box = motionBox(target);
    onBound(binding);
    if (!watcher && hasNoBox(target)) {
      watcher = new MutationObserver(followBox);
      watcher.observe(target, { childList: true, subtree: true });
    }
  };
  if (typeof source === 'string' && !resolveGesture(source)) {
    stopWaiting = onGestureDefined((ref) => {
      if (ref.name !== source) return;
      stopWaiting?.();
      stopWaiting = undefined;
      bind(ref);
    });
  } else {
    bind(source);
  }
  return () => {
    cancelled = true;
    stopWaiting?.();
    stopWaiting = undefined;
    watcher?.disconnect();
    watcher = undefined;
    binding?.destroy();
    binding = undefined;
  };
}

/**
 * Gives the element it sits on a gesture of `@udixio/motion`: a drag that follows the pointer, a swipe that flies away, or a
 * reorder among its siblings, with its keyboard alternative. Each event of the gesture is emitted on its output, as the
 * `CustomEvent` the gesture dispatched: a handler that calls `$event.preventDefault()` keeps the element in place (a
 * swipe) or the order as it is (a reorder).
 *
 * @status beta
 * @devx
 * - Bind it as `<li udxMotionGesture="swipe-dismiss" (udxSwipe)="remove(item)">`: a swiped row removes itself from the list,
 *   and focus held in it moves to the next row by itself (`[udxMotionRestoreFocus]` names another target, `false` none).
 * - A reorder list prevents the move and moves the item in its state, so the template renders the new order and the layout
 *   motion animates it: `<li udxMotionGesture="reorder-row" (udxReorder)="onReorder($event)">`, with
 *   `onReorder(event: CustomEvent<{ from: number; to: number }>) { event.preventDefault(); this.move(event.detail); }`.
 * - Call `reset()` on the template reference `#row="udxMotionGesture"` to put the element back at offset 0.
 * @limitations
 * - The directive binds after the host has rendered, in the browser only: nothing is bound during server rendering.
 */
@Directive({
  selector: '[udxMotionGesture]',
  standalone: true,
  exportAs: 'udxMotionGesture',
})
export class MotionGesture implements OnDestroy {
  /** The gesture: the name of a defined gesture, or its definition. A change binds the element again. */
  readonly source = input.required<GestureRef | string>({ alias: 'udxMotionGesture' });
  /**
   * Where focus goes when a swipe flies out with focus inside the host (WCAG 2.4.3): an element, or a function that gives one
   * then; `false` leaves focus where it is. Without one, focus moves to the next sibling with the same gesture, else the
   * previous one, else the parent. Read when the swipe flies out. The same input as `udxMotion`'s, so one binding serves an
   * exit and a swipe.
   */
  readonly restoreFocus = input<GestureOptions['restoreFocus']>(undefined, { alias: 'udxMotionRestoreFocus' });
  /** Emits the release of a drag, once it has come to rest; its `detail` is the offset `{ x, y }` it came to rest at. */
  readonly dragEnd = output<CustomEvent<{ x: number; y: number }>>({ alias: 'udxDragEnd' });
  /** Emits each swipe, before it flies out. Preventing it keeps the element in place. */
  readonly swipe = output<CustomEvent<{ direction: 'start' | 'end' }>>({ alias: 'udxSwipe' });
  /** Emits each reorder step, before the element moves. Preventing it keeps the order. */
  readonly reorder = output<CustomEvent<{ from: number; to: number }>>({ alias: 'udxReorder' });

  private readonly host = inject(ElementRef<HTMLElement>);
  private binding?: GestureBinding;
  private destroyBinding?: () => void;
  private boundKey?: string;

  constructor() {
    // Browser only, after the host has rendered. A change of the name binds again.
    afterRenderEffect(() => {
      const source = this.source();
      const key = typeof source === 'string' ? source : source.name;
      if (key === this.boundKey) return;
      untracked(() => {
        this.unbind();
        this.boundKey = key;
        // Read when a swipe flies out, so a new value never binds the host again.
        const restoreFocus = () => {
          const given = this.restoreFocus();
          return typeof given === 'function' ? given() : given;
        };
        this.destroyBinding = bindGestureWhenDefined(this.host.nativeElement, source, { restoreFocus }, (binding) => {
          this.binding = binding;
        });
      });
    });
  }

  /** Puts the element back at offset 0, with the release spring. Does nothing before the element is bound. */
  reset(): void {
    this.binding?.reset();
  }

  @HostListener('motion-dragend', ['$event'])
  protected onDragEnd(event: Event): void {
    this.dragEnd.emit(event as CustomEvent<{ x: number; y: number }>);
  }

  @HostListener('motion-swipe', ['$event'])
  protected onSwipe(event: Event): void {
    this.swipe.emit(event as CustomEvent<{ direction: 'start' | 'end' }>);
  }

  @HostListener('motion-reorder', ['$event'])
  protected onReorder(event: Event): void {
    this.reorder.emit(event as CustomEvent<{ from: number; to: number }>);
  }

  ngOnDestroy(): void {
    this.unbind();
  }

  private unbind(): void {
    this.binding = undefined;
    this.destroyBinding?.();
    this.destroyBinding = undefined;
  }
}
