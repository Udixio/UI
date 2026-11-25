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
  loadGestures,
  onGestureDefined,
  resolveGesture,
  type GestureBinding,
  type GestureOptions,
  type GestureRef,
} from '@udixio/motion';

/**
 * Binds a gesture to an element now, or as soon as the named gesture is defined, once the gestures module is loaded: until
 * then the element is not touched, so a render never throws because of a gesture. The binding follows the box of an element
 * declared with no box: when that box is replaced, the gesture moves to the new one in the binding itself, which stays the same.
 * Returns the function that destroys the binding.
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
    binding = api.gesture(target, ref, options);
    onBound(binding);
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
    binding?.destroy();
    binding = undefined;
  };
}

/**
 * Gives the element it sits on a gesture of `@udixio/motion`: a drag that follows the pointer, a swipe that flies away, or a
 * reorder among its siblings, with its keyboard alternative. Each event of the gesture is emitted on its output, as the
 * `CustomEvent` the gesture dispatched: a handler that calls `$event.preventDefault()` keeps the element in place (a
 * swipe), or, for a reorder, renders the step itself (see `(udxReorder)` below).
 *
 * @status beta
 * @devx
 * - Bind it as `<li udxMotionGesture="swipe-dismiss" (udxSwipe)="remove(item)">`: a swiped row removes itself from the list,
 *   and focus held in it moves to the next row by itself (`[udxMotionRestoreFocus]` names another target, `false` none).
 * - A reorder list moves the item in its state, and the template renders the new order, which the layout motion animates:
 *   `<li udxMotionGesture="reorder-row" (udxReorder)="onReorder($event)">`, with
 *   `onReorder(event: CustomEvent<{ from: number; to: number }>) { event.preventDefault(); this.move(event.detail); }`.
 *   `preventDefault()` means you render the step yourself; if nothing is rendered, the step is dropped.
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
  /**
   * Emits each reorder step, before the element moves. `preventDefault()` means you render the step yourself; if nothing is
   * rendered, the step is dropped.
   */
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
