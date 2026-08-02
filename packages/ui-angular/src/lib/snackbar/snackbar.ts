import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  input,
  output,
  untracked,
  viewChild,
  type OnInit,
} from '@angular/core';
import {
  snackbarStyle,
  type ClassNameComponent,
  type SnackbarInterface,
  type SnackbarProps,
} from '@udixio/core';
import {
  createSnackbarAutoDismissController,
  createSnackbarTransitionController,
  type SnackbarTransitionController,
} from '@udixio/core/dom';
import { iClose } from '@udixio/icons-rounded-400/close';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';
import { IconButton } from '../icon-button/icon-button';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

/**
 * Snackbars show a brief, non-blocking status message about an app process.
 *
 * @status beta
 * @category Communication
 * @devx
 * - `open` is controlled; `defaultOpen` initializes uncontrolled usage. Defaults to `true`.
 * - `duration` (ms) auto-dismisses the snackbar; omit it to require an explicit `openChange`
 *   or a click on the built-in close button.
 * - Renders in normal document flow at the call site. Fixed/bottom positioning, stacking, and
 *   queueing multiple snackbars are the caller's responsibility.
 * - The height transition is implemented once with Motion JavaScript in `@udixio/core/dom`,
 *   shared with React. It applies the initial `open` state immediately; only transitions after
 *   the first render animate.
 * @a11y
 * - Renders `role="status"` and `aria-live="polite"` so assistive technology announces the
 *   message without interrupting the user. The element stays mounted and `inert` while closed
 *   instead of unmounting, so the live region is reliably present before it announces.
 * @limitations
 * - No built-in queue/stacking for multiple simultaneous snackbars.
 */
@Component({
  selector: 'lib-snackbar',
  standalone: true,
  imports: [IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div
      #panel
      [class]="styles()['snackbar']"
      role="status"
      aria-live="polite"
      [attr.aria-hidden]="!isOpen()"
      [attr.inert]="!isOpen() ? '' : null"
    >
      <div [class]="styles()['container']">
        <p [class]="styles()['supportingText']">{{ message() }}</p>
        <lib-icon-button
          label="Close the snackbar"
          [icon]="closeIcon()"
          [className]="styles()['icon']"
          (click)="close()"
        />
      </div>
    </div>
  `,
})
export class Snackbar implements OnInit {
  readonly message = input.required<SnackbarProps['message']>();
  readonly open = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly defaultOpen = input(true, { transform: booleanAttribute });
  readonly duration = input<SnackbarProps['duration']>();
  readonly closeIcon = input<NonNullable<SnackbarProps['closeIcon']>>(iClose);
  readonly transition = input<SnackbarProps['transition']>();
  /** Classes or state-aware element classes applied through the shared style contract. */
  readonly className = input<string | ClassNameComponent<SnackbarInterface>>();

  /** Emits an accepted open-state request and supports `[(open)]`. */
  readonly openChange = output<boolean>();

  private readonly openState = createControllableState({
    value: this.open,
    defaultValue: this.defaultOpen,
    onChange: (open) => this.openChange.emit(open),
    componentName: 'Snackbar',
    stateName: 'open',
  });

  protected readonly isOpen = this.openState.value;
  protected readonly styles = createStyle(snackbarStyle, () => ({
    message: this.message(),
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    duration: this.duration(),
    closeIcon: this.closeIcon(),
    transition: this.transition(),
    isOpen: this.isOpen(),
    className: this.className(),
  }));

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private transitionController?: SnackbarTransitionController;

  constructor() {
    afterRenderEffect((onCleanup) => {
      const panel = this.panel()?.nativeElement;
      if (!panel) return;

      const controller = createSnackbarTransitionController({
        panel,
        open: untracked(() => this.isOpen()),
        transition: untracked(() => this.transition()),
      });
      this.transitionController = controller;
      onCleanup(() => {
        controller.destroy();
        if (this.transitionController === controller) {
          this.transitionController = undefined;
        }
      });
    });

    afterRenderEffect(() => {
      this.transitionController?.setOpen(this.isOpen());
    });

    afterRenderEffect((onCleanup) => {
      const duration = this.duration();
      if (!this.isOpen() || !duration) return;

      const controller = createSnackbarAutoDismissController({
        duration,
        onDismiss: () => this.openState.set(false),
      });
      onCleanup(() => controller.destroy());
    });
  }

  ngOnInit(): void {
    this.openState.initialize();
  }

  protected close(): void {
    this.openState.set(false);
  }
}
