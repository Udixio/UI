import { isPlatformServer } from '@angular/common';
import {
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterRenderEffect,
  booleanAttribute,
  effect,
  inject,
  input,
  untracked,
  type AnimationCallbackEvent,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import {
  motionWhenDefined,
  type DeferredMotion,
  type MotionBinding,
  type MotionElement,
  type MotionKind,
  type MotionSource,
} from '@udixio/motion';

/** Identifies a source: a name, the name of a definition, or the content of a raw spec. */
const sourceKey = (source: MotionSource): string =>
  typeof source === 'string'
    ? source
    : 'name' in source
      ? source.name
      : JSON.stringify(source);

const isList = (
  source: MotionSource | readonly MotionSource[],
): source is readonly MotionSource[] => Array.isArray(source);

/** The motions of a source or a list: a string is split on whitespace, and so is each string of a list. */
const motionsOf = (source: MotionSource | readonly MotionSource[]): MotionSource[] => {
  const list: readonly MotionSource[] = isList(source) ? source : [source];
  return list.flatMap((each): MotionSource[] =>
    typeof each === 'string' ? each.split(/\s+/).filter(Boolean) : [each],
  );
};

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
 * - Several motions can share one element, as names separated by spaces or as a
 *   list: `<li udxMotion="fade reflow">` enters and leaves with its presence, and
 *   follows its neighbours with its layout.
 * - A layout can share an identity with `[udxMotionShared]`: a thumbnail and its
 *   detail that share `'pic-' + id` morph into each other, as in
 *   `<img udxMotion="reflow" [udxMotionShared]="'pic-' + id">`.
 * - A loop pauses by itself out of view. `[udxMotionPaused]` holds it for the
 *   author too, as in `<span udxMotion="rotate" [udxMotionPaused]="!loading()">`;
 *   a `pause: 'control'` loop needs a visible control that sets it.
 * - The directive holds no animation of its own: the motion is defined and
 *   timed by `@udixio/motion`.
 * @a11y
 * - An exit keeps the element in the accessibility tree until it has played,
 *   and the core makes it `inert` meanwhile.
 * @limitations
 * - Content rendered by the server is marked present, so it does not replay its
 *   entry on hydration; `udxMotionSettled` still skips the entry of other content.
 * - A leave inside a child component's template follows Angular's own rule:
 *   apply the directive on the child host in the parent template.
 */
@Directive({
  selector: '[udxMotion]',
  standalone: true,
  exportAs: 'udxMotion',
  host: { '(animate.leave)': 'leave($event)' },
})
export class Motion implements OnInit, OnDestroy {
  /** The motion: the name of a defined motion, a definition, or a raw spec. A list of them, or names separated by spaces, binds each one. */
  readonly source = input.required<MotionSource | readonly MotionSource[]>({ alias: 'udxMotion' });
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
  /** The shared identity: a layout motion morphs from the place of another element that held the same key. A change binds the element again. */
  readonly shared = input<string | undefined>(undefined, { alias: 'udxMotionShared' });
  /** Holds a loop while true and plays it again when false: a loop pauses by itself out of view, and this holds it for the author too (WCAG 2.2.2). Ignored without a loop. */
  readonly paused = input(false, {
    alias: 'udxMotionPaused',
    transform: booleanAttribute,
  });

  private readonly host = inject(ElementRef<MotionElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private deferred: DeferredMotion[] = [];
  private boundKey?: string;
  private leaving = false;
  private released = false;
  private stateRead = false;
  private previousState: unknown;

  /** The core binding (handle: pause, reverse, seek), once bound: the presence if any, else the first. */
  get binding(): MotionBinding | undefined {
    return this.bindingOf('presence') ?? this.bindings()[0];
  }

  /** The core binding of a kind, once bound. */
  bindingOf(kind: MotionKind): MotionBinding | undefined {
    return this.bindings().find((binding) => binding.kind === kind);
  }

  constructor() {
    // Browser only, after the host has rendered. A source change rebinds; the
    // new bindings start settled, so a rebind does not replay the entry.
    afterRenderEffect(() => {
      const sources = motionsOf(this.source());
      const shared = this.shared();
      // A change of the shared identity is a change of the binding, as a change of a source is.
      const key = JSON.stringify([sources.map(sourceKey), shared ?? null]);
      if (key === this.boundKey) return;
      untracked(() => {
        const rebinding = this.boundKey !== undefined;
        this.deferred.forEach((each) => each.destroy());
        const present = this.present();
        // A rebinding is in place; server-rendered content is marked present, and the core binds a marked element settled.
        const settled = rebinding || this.settled() ? true : undefined;
        const paused = this.paused();
        this.deferred = sources.map((each) =>
          motionWhenDefined(this.host.nativeElement, each, { present, settled, shared, ...(paused && { paused: true }) }),
        );
        // A loop bound while the author holds it starts paused.
        if (this.paused()) this.bindingOf('loop')?.pause();
        this.boundKey = key;
      });
    });

    // A change of udxMotionPaused pauses or plays the loop. The first run is the value the binding read at bind, so it does nothing.
    let pausedRead = false;
    effect(() => {
      const paused = this.paused();
      if (!pausedRead) {
        pausedRead = true;
        return;
      }
      untracked(() => {
        const loop = this.bindingOf('loop');
        if (paused) loop?.pause();
        else loop?.play();
      });
    });

    // Declared after the binding effect, so the bindings it reads are the ones
    // just made. The core ignores a value it already has.
    // Each motion takes the presence: one not defined yet keeps it for its definition.
    afterRenderEffect(() => {
      const present = this.present();
      for (const each of this.deferred) void each.setPresent(present);
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

  ngOnInit(): void {
    // Rendered on the server, a present element is marked, so that the browser binds it settled.
    if (isPlatformServer(this.platformId) && this.present()) this.host.nativeElement.setAttribute('data-presence', 'present');
  }

  /** Replays the emphasis. A replay asked before the emphasis is defined plays once it is; without an emphasis, nothing. */
  play(): void {
    for (const each of this.deferred) each.play();
  }

  ngOnDestroy(): void {
    if (this.deferred.length === 0) return;
    // Angular may destroy the directive before or after it calls `leave`. A
    // destroy would cancel a running exit, so the binding is released a
    // macrotask later, after the tick in which Angular calls `leave`.
    setTimeout(() => {
      if (!this.leaving) this.release();
    });
  }

  /** Angular calls this before it removes the element; the removal waits for `animationComplete()`. */
  protected leave(event: AnimationCallbackEvent): void {
    const binding = this.released ? undefined : this.bindingOf('presence');
    // The bindings are released before the element is allowed to leave: a shared element keeps its box in flight, which is read from the page.
    if (!binding) {
      this.release();
      event.animationComplete();
      return;
    }
    this.leaving = true;
    void binding.setPresent(false).then(() => {
      this.release();
      event.animationComplete();
    });
  }

  private bindings(): MotionBinding[] {
    return this.deferred.flatMap((each) => (each.binding ? [each.binding] : []));
  }

  private release(): void {
    if (this.released) return;
    this.released = true;
    this.deferred.forEach((each) => each.destroy());
  }
}
