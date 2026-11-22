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
  isMotionDevelopment,
  motionsWhenDefined,
  playListed,
  setPresentByHidden,
  type BindOptions,
  type DeferredMotion,
  type MotionBinding,
  type MotionElement,
  type MotionHandle,
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
 *   exit plays when it turns `false`, then `hidden` hides the node, and the
 *   entry plays when it turns `true`, as for an HTML element with `hidden` and
 *   `data-motion`. Navigation and content (menus, tab panels, accordions) take
 *   it, so that their links and text are in the server HTML; transient UI
 *   (toasts, dialogs, list items) goes in an `@if`.
 * - Bind `[udxMotionState]` to the value that changes: each change calls
 *   `play()` without a kind, so the first listed motion that is not a presence
 *   plays. `<button udxMotion="press" [udxMotionState]="count()">` replays the
 *   press; `<div udxMotion="reflow" [udxMotionState]="wide()" [style.width.px]="wide() ? 480 : 240">`
 *   moves once the new width is rendered.
 * - For a replay from a control, export the directive:
 *   `<div udxMotion="press" #m="udxMotion">` and `(click)="m.play()"`;
 *   `m.play('layout')` plays the binding of a kind.
 * - Several motions can share one element, as names separated by spaces or as a
 *   list: `<li udxMotion="fade reflow">` enters and leaves with its presence, and
 *   follows its neighbours with its layout. One motion of each kind: of two names
 *   of one kind, such as `"fade slide"`, the first listed is bound and the other is
 *   ignored, reported in development.
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
 * - With focus inside, an exit moves it to `[udxMotionRestoreFocus]` first, so
 *   the focus is not lost (WCAG 2.4.3); without that target the element stays
 *   focusable until focus leaves it.
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
  /** The motion: the name of a defined motion, a definition, or a raw spec. A list of them, or names separated by spaces, binds one of each kind, the first listed. */
  readonly source = input.required<MotionSource | readonly MotionSource[]>({ alias: 'udxMotion' });
  /**
   * Whether the element is present. The element stays in the DOM: `false` plays its exit, the element staying displayed
   * until the exit has finished, then `hidden` hides it; `true` removes `hidden` and plays its entry. An element absent
   * from its first render is `hidden` at once, in the server HTML too, so its content stays indexable. While it stays
   * `true`, the element's own `hidden` is left to the author.
   */
  readonly present = input(true, {
    alias: 'udxMotionPresent',
    transform: booleanAttribute,
  });
  /** A value whose change calls `play()` without a kind: the first listed motion that is not a presence plays. */
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
  /** Where focus goes when an exit starts with focus inside the element: an element, or a function that gives one then. Read when the element binds. `false`, for a swipe of `udxMotionGesture` that reads the same input, gives an exit no target. */
  readonly restoreFocus = input<BindOptions['restoreFocus'] | false>(undefined, { alias: 'udxMotionRestoreFocus' });

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
        // `false` is for a swipe of `udxMotionGesture` (the same input): an exit has no target then.
        const restoreFocus = this.restoreFocus() || undefined;
        // One motion of each kind, the first listed: the core leaves the others unbound.
        this.deferred = motionsWhenDefined(this.host.nativeElement, sources, {
          present,
          settled,
          shared,
          restoreFocus,
          ...(paused && { paused: true }),
          // In development the core reports a misspelt name, an invalid spec, an exit that holds focus, two motions of one kind.
          ...(isMotionDevelopment() && { development: true }),
        });
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
    // A change follows `hidden`, as in HTML (`setPresentByHidden`): the host stays
    // displayed while its exit plays, then `hidden` hides it; the entry removes it.
    let appliedPresent: boolean | undefined;
    afterRenderEffect(() => {
      const present = this.present();
      const changed = appliedPresent !== undefined && appliedPresent !== present;
      appliedPresent = present;
      untracked(() => {
        if (changed) void setPresentByHidden(this.host.nativeElement, present, this.deferred);
        else for (const each of this.deferred) void each.setPresent(present);
      });
    });

    // After the render that applies the change, so that a layout measures the host's new style (`[style.width.px]`).
    afterRenderEffect(() => {
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
    if (isPlatformServer(this.platformId) && this.present()) this.host.nativeElement.setAttribute('data-motion-presence', 'present');
    // An absent element is hidden from its first render, the server's included: it stays in the DOM, and plays no exit.
    if (!this.present() && !this.host.nativeElement.hasAttribute('hidden')) this.host.nativeElement.setAttribute('hidden', '');
  }

  /**
   * Plays a motion of the host and returns its handle: with a kind, the binding of that kind; without one, the first listed
   * motion that is not a presence. An emphasis replays, a reveal replays from its first frame, a layout compares and moves
   * now, a loop resumes. A scrub follows the scroll and a presence is shown or hidden with `[udxMotionPresent]`: their
   * `play()` plays nothing and returns undefined, reported in development. When nothing bound matches while a listed name is
   * not defined yet, it returns undefined and plays once that motion is defined.
   */
  play(kind?: MotionKind): MotionHandle | undefined {
    return playListed(this.deferred, kind);
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
