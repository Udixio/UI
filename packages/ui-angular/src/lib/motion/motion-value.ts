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
import type { ValueBinding, ValueRef } from '@udixio/motion';
import { onValueDefined, resolveValue, value } from '@udixio/motion/value';

/**
 * Binds a value now, or as soon as the named value is defined: until then the element is not touched, so a render never
 * throws because of a value. Returns the function that destroys the binding.
 */
function bindValueWhenDefined(
  target: HTMLElement,
  source: ValueRef | string,
  onBound: (binding: ValueBinding) => void,
): () => void {
  let binding: ValueBinding | undefined;
  let stopWaiting: (() => void) | undefined;
  const bind = (ref: ValueRef | string) => {
    binding = value(target, ref);
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
    stopWaiting?.();
    stopWaiting = undefined;
    binding?.destroy();
    binding = undefined;
  };
}

/**
 * Writes a named value of `@udixio/motion` on the element it sits on, as `--udx-motion-value-<name>`.
 *
 * Reading the number with `get()` never re-renders anything. `udxMotionValueChange` emits each new number, for the
 * template that wants it.
 *
 * @status beta
 * @devx
 * - Bind it as `<div udxMotionValue="tilt">`: the card's class reads `--udx-motion-value-tilt`.
 * - A change of the name binds the element again: the old binding is destroyed.
 * - Read the number in a template handler, or call `get()` and `set(n)` on the template reference
 *   `#tilt="udxMotionValue"`.
 * @limitations
 * - The directive binds after the host has rendered, in the browser only: nothing is written during server rendering.
 */
@Directive({
  selector: '[udxMotionValue]',
  standalone: true,
  exportAs: 'udxMotionValue',
})
export class MotionValue implements OnDestroy {
  /** The value: the name of a defined value, or its definition. A change binds the element again. */
  readonly source = input.required<ValueRef | string>({ alias: 'udxMotionValue' });
  /** Emits each new number of the value, after it is written. */
  readonly valueChange = output<number>({ alias: 'udxMotionValueChange' });

  private readonly host = inject(ElementRef<HTMLElement>);
  private binding?: ValueBinding;
  private destroyBinding?: () => void;
  private boundKey?: string;
  /** Emits each number as the output. */
  private readonly relay = (next: number): void => {
    this.valueChange.emit(next);
  };
  /** Each listener, with its unsubscribe from the binding it is on now (none while the element is not bound). */
  private readonly listeners = new Map<(next: number) => void, (() => void) | undefined>([[this.relay, undefined]]);

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
          for (const listener of this.listeners.keys()) {
            this.listeners.set(listener, binding.subscribe(listener));
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

  /** Calls the listener with each new number, and returns its unsubscribe. A listener follows the element when it is bound again. */
  subscribe(listener: (next: number) => void): () => void {
    this.listeners.set(listener, this.binding?.subscribe(listener));
    return () => {
      this.listeners.get(listener)?.();
      this.listeners.delete(listener);
    };
  }

  ngOnDestroy(): void {
    this.unbind();
  }

  private unbind(): void {
    for (const [listener, unsubscribe] of this.listeners) {
      unsubscribe?.();
      this.listeners.set(listener, undefined);
    }
    this.binding = undefined;
    this.destroyBinding?.();
    this.destroyBinding = undefined;
  }
}
