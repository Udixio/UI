import {
  Directive,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  inject,
  input,
  untracked,
  type OnDestroy,
} from '@angular/core';
import {
  loadSequences,
  onSequenceDefined,
  resolveSequence,
  sequencesModule,
  type MotionHandle,
  type SequenceBinding,
  type SequenceRef,
} from '@udixio/motion';

/**
 * Binds a sequence to a root now, or as soon as the named sequence is defined, settled, once the sequences module is loaded:
 * until then the root is not touched, so a render never throws because of a sequence. Returns the function that destroys
 * the binding.
 */
function bindSequenceWhenDefined(
  root: HTMLElement,
  source: SequenceRef | string,
  settled: boolean,
  onBound: (binding: SequenceBinding) => void,
): () => void {
  let binding: SequenceBinding | undefined;
  let stopWaiting: (() => void) | undefined;
  let cancelled = false;
  const bind = (ref: SequenceRef | string, asSettled: boolean) => {
    const api = sequencesModule();
    if (!api) {
      // The module loads once per page; a binding released before it arrives never binds.
      void loadSequences().then(
        () => {
          if (!cancelled) bind(ref, asSettled);
        },
        () => {},
      );
      return;
    }
    binding = api.sequence(root, ref, { settled: asSettled });
    onBound(binding);
  };
  if (typeof source === 'string' && !resolveSequence(source)) {
    stopWaiting = onSequenceDefined((ref) => {
      if (ref.name !== source) return;
      stopWaiting?.();
      stopWaiting = undefined;
      bind(ref, true);
    });
  } else {
    bind(source, settled);
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
 * Plays a named sequence of `@udixio/motion` on the element it sits on: its children that carry `data-motion-step` are
 * its steps, and one handle plays the whole choreography.
 *
 * @status beta
 * @devx
 * - Bind it as `<section udxMotionSequence="hero">`; read `handle` or call `play()` on the template reference
 *   `#hero="udxMotionSequence"` to replay it.
 * - A change of the name binds the new sequence settled, as `udxMotion` does: call `play()` to replay it.
 * @limitations
 * - Server-rendered content replays its entry once the directive binds in the browser, unless
 *   `udxMotionSequenceSettled` is set.
 */
@Directive({
  selector: '[udxMotionSequence]',
  standalone: true,
  exportAs: 'udxMotionSequence',
})
export class MotionSequence implements OnDestroy {
  /** The sequence: the name of a defined sequence, or its definition. A change binds the element again. */
  readonly source = input.required<SequenceRef | string>({ alias: 'udxMotionSequence' });
  /** Skips the entry: the content is already in its place, such as after server rendering. */
  readonly settled = input(false, {
    alias: 'udxMotionSequenceSettled',
    transform: booleanAttribute,
  });

  private readonly host = inject(ElementRef<HTMLElement>);
  private binding?: SequenceBinding;
  private destroyBinding?: () => void;
  private boundKey?: string;

  /** The handle of the latest play, or null before the first one. */
  get handle(): MotionHandle | null {
    return this.binding?.handle ?? null;
  }

  constructor() {
    // Browser only, after the host has rendered. A change of the name binds again, settled.
    afterRenderEffect(() => {
      const source = this.source();
      const key = typeof source === 'string' ? source : source.name;
      if (key === this.boundKey) return;
      untracked(() => {
        const rebinding = this.boundKey !== undefined;
        this.unbind();
        this.boundKey = key;
        this.destroyBinding = bindSequenceWhenDefined(
          this.host.nativeElement,
          source,
          rebinding || this.settled(),
          (binding) => {
            this.binding = binding;
          },
        );
      });
    });
  }

  /** Replays the sequence from its start. Does nothing until the sequence is bound. */
  play(): void {
    this.binding?.play();
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
