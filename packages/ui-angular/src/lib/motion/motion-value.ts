import {
  Directive,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  output,
  untracked,
  type OnDestroy,
} from '@angular/core';
import {
  loadValues,
  onValueDefined,
  resolveValue,
  valuesModule,
  type ValueBinding,
  type ValueRef,
} from '@udixio/motion';

/**
 * Binds a value now, or as soon as the named value is defined, once the values module is loaded: until then the element is
 * not touched, so a render never throws because of a value. Returns the function that destroys the binding.
 */
function bindValueWhenDefined(
  target: HTMLElement,
  source: ValueRef | string,
  onBound: (binding: ValueBinding) => void,
): () => void {
  let binding: ValueBinding | undefined;
  let stopWaiting: (() => void) | undefined;
  let cancelled = false;
  const bind = (ref: ValueRef | string) => {
    const api = valuesModule();
    if (!api) {
      // The module loads once per page; a binding released before it arrives never binds.
      void loadValues().then(
        () => {
          if (!cancelled) bind(ref);
        },
        () => {},
      );
      return;
    }
    binding = api.value(target, ref);
    onBound(binding);
  };
  if (typeof source === 'string' && !resolveValue(source)) {
    stopWaiting = onValueDefined((ref) => {
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
 * A listener of the directive: whether it follows each frame, and its unsubscribe from the binding it is on now (none
 * while the element is not bound).
 */
type Follower = { perFrame: boolean; unsubscribe?: () => void };

/**
 * Writes a named value of `@udixio/motion` on the element it sits on, as `--udx-motion-value-<name>`.
 *
 * Reading the number with `get()` never re-renders anything. `udxMotionValueChange` emits when the value comes to rest and
 * when its target changes, not on each frame: to follow each frame, read the CSS variable `--udx-motion-value-<name>`, or
 * call `subscribe()`.
 *
 * @status beta
 * @devx
 * - Bind it as `<div udxMotionValue="tilt">`: the card's class reads `--udx-motion-value-tilt`.
 * - A change of the name binds the element again: the old binding is destroyed.
 * - Read the number in a template handler, or call `get()` and `set(n)` on the template reference
 *   `#tilt="udxMotionValue"`.
 * @limitations
 * - The directive binds after the host has rendered, in the browser only: nothing is written during server rendering.
 * - `udxMotionValueChange` does not emit on each frame: a pointer or scroll value emits at each change of its target, which
 *   follows the input events.
 */
@Directive({
  selector: '[udxMotionValue]',
  standalone: true,
  exportAs: 'udxMotionValue',
})
export class MotionValue implements OnDestroy {
  /** The value: the name of a defined value, or its definition. A change binds the element again. */
  readonly source = input.required<ValueRef | string>({ alias: 'udxMotionValue' });
  /** Emits the number when the value comes to rest, and each change of its target: not on each frame. */
  readonly valueChange = output<number>({ alias: 'udxMotionValueChange' });

  private readonly host = inject(ElementRef<HTMLElement>);
  private binding?: ValueBinding;
  private destroyBinding?: () => void;
  private boundKey?: string;
  /** Emits each number as the output. */
  private readonly relay = (next: number): void => {
    this.valueChange.emit(next);
  };
  /** Each listener, with how it follows the value and its unsubscribe from the binding it is on now. */
  private readonly listeners = new Map<(next: number) => void, Follower>([[this.relay, { perFrame: false }]]);

  constructor() {
    // Browser only, after the host has rendered. A change of the name binds again.
    afterRenderEffect(() => {
      const source = this.source();
      const key = typeof source === 'string' ? source : source.name;
      if (key === this.boundKey) return;
      untracked(() => {
        this.unbind();
        this.boundKey = key;
        this.destroyBinding = bindValueWhenDefined(this.host.nativeElement, source, (binding) => {
          this.binding = binding;
          for (const [listener, follower] of this.listeners) {
            follower.unsubscribe = binding.subscribe(listener, { perFrame: follower.perFrame });
          }
        });
      });
    });
  }

  /** The number the value holds, or undefined before the element is bound. Reading it never re-renders. */
  get(): number | undefined {
    return this.binding?.current;
  }

  /** Moves a state value to a number, clamped to its range. Does nothing before the element is bound. */
  set(next: number): void {
    this.binding?.set(next);
  }

  /**
   * Calls the listener with each new number, on each frame, and returns its unsubscribe. A listener follows the element
   * when it is bound again.
   */
  subscribe(listener: (next: number) => void): () => void {
    const follower: Follower = { perFrame: true, unsubscribe: this.binding?.subscribe(listener, { perFrame: true }) };
    this.listeners.set(listener, follower);
    return () => {
      follower.unsubscribe?.();
      this.listeners.delete(listener);
    };
  }

  ngOnDestroy(): void {
    this.unbind();
  }

  private unbind(): void {
    for (const follower of this.listeners.values()) {
      follower.unsubscribe?.();
      follower.unsubscribe = undefined;
    }
    this.binding = undefined;
    this.destroyBinding?.();
    this.destroyBinding = undefined;
  }
}
