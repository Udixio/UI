import {
  Directive,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  effect,
  inject,
  input,
  untracked,
  type AnimationCallbackEvent,
  type OnDestroy,
} from '@angular/core';
import {
  motionWhenDefined,
  type DeferredMotion,
  type MotionBinding,
  type MotionSource,
} from '@udixio/motion';

/** Identifies a source: a name, the name of a definition, or the content of a raw spec. */
const sourceKey = (source: MotionSource): string =>
  typeof source === 'string'
    ? source
    : 'name' in source
      ? source.name
      : JSON.stringify(source);

/**
 * Plays a named motion on the element it sits on, from `@udixio/motion`.
 *
 * @status beta
 * @devx
 * - Put it on what enters and leaves: `@if (open()) { <div udxMotion="slide">…</div> }`.
 *   Angular keeps the element until the exit has played, then removes it.
 * - For a node the template keeps in the DOM, bind `[udxMotionPresent]`: the
 *   exit plays when it turns `false` and the entry when it turns `true`.
 * - For an emphasis, bind `[udxMotionState]` to the value that changes:
 *   `<button udxMotion="press" [udxMotionState]="count()">`. Each change
 *   replays the emphasis.
 * - The directive holds no animation of its own: the motion is defined and
 *   timed by `@udixio/motion`.
 * @a11y
 * - An exit keeps the element in the accessibility tree until it has played,
 *   and the core makes it `inert` meanwhile.
 * @limitations
 * - Server-rendered content replays its entry on hydration unless
 *   `udxMotionSettled` is set.
 * - A leave inside a child component's template follows Angular's own rule:
 *   apply the directive on the child host in the parent template.
 */
@Directive({
  selector: '[udxMotion]',
  standalone: true,
  exportAs: 'udxMotion',
  host: { '(animate.leave)': 'leave($event)' },
})
export class Motion implements OnDestroy {
  /** The motion: the name of a defined motion, a definition, or a raw spec. */
  readonly source = input.required<MotionSource>({ alias: 'udxMotion' });
  /** Whether the element is present; `false` plays its exit and keeps it in the DOM. */
  readonly present = input(true, {
    alias: 'udxMotionPresent',
    transform: booleanAttribute,
  });
  /** A value whose change replays an emphasis. */
  readonly state = input<unknown>(undefined, { alias: 'udxMotionState' });
  /** Skips the entry of an element that is already present, such as after server rendering. */
  readonly settled = input(false, {
    alias: 'udxMotionSettled',
    transform: booleanAttribute,
  });

  private readonly host = inject(ElementRef<HTMLElement>);
  private deferred?: DeferredMotion;
  private boundKey?: string;
  private leaving = false;
  private released = false;
  private stateRead = false;
  private previousState: unknown;

  /** The core binding (handle: pause, reverse, seek), once bound. */
  get binding(): MotionBinding | undefined {
    return this.deferred?.binding;
  }

  constructor() {
    // Browser only, after the host has rendered. A source change rebinds; the
    // new binding starts settled, so a rebind does not replay the entry.
    afterRenderEffect(() => {
      const source = this.source();
      const key = sourceKey(source);
      if (key === this.boundKey) return;
      untracked(() => {
        const rebinding = this.deferred !== undefined;
        this.deferred?.destroy();
        this.deferred = motionWhenDefined(this.host.nativeElement, source, {
          present: this.present(),
          settled: rebinding || this.settled(),
        });
        this.boundKey = key;
      });
    });

    // Declared after the binding effect, so the binding it reads is the one
    // just made. The core ignores a value it already has.
    afterRenderEffect(() => {
      const present = this.present();
      const binding = this.deferred?.binding;
      if (binding && binding.verb !== 'emphasize') void binding.setPresent(present);
    });

    effect(() => {
      const state = this.state();
      if (!this.stateRead) {
        this.stateRead = true;
        this.previousState = state;
        return;
      }
      if (Object.is(state, this.previousState)) return;
      this.previousState = state;
      untracked(() => this.play());
    });
  }

  /** Replays the emphasis. Does nothing until the motion is bound, or for a presence motion. */
  play(): void {
    const binding = this.deferred?.binding;
    if (binding?.verb === 'emphasize') binding.play();
  }

  ngOnDestroy(): void {
    if (!this.deferred) return;
    // Angular may destroy the directive before or after it calls `leave`. A
    // destroy would cancel a running exit, so the binding is released a
    // macrotask later, after the tick in which Angular calls `leave`.
    setTimeout(() => {
      if (!this.leaving) this.release();
    });
  }

  /** Angular calls this before it removes the element; the removal waits for `animationComplete()`. */
  protected leave(event: AnimationCallbackEvent): void {
    const binding = this.released ? undefined : this.deferred?.binding;
    if (!binding || binding.verb === 'emphasize') {
      event.animationComplete();
      this.release();
      return;
    }
    this.leaving = true;
    void binding.setPresent(false).then(() => {
      event.animationComplete();
      this.release();
    });
  }

  private release(): void {
    if (this.released) return;
    this.released = true;
    this.deferred?.destroy();
  }
}
