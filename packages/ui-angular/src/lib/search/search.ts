import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
  type OnInit,
  untracked,
  viewChild,
} from '@angular/core';
import {
  getSearchExpansionTransition,
  getSearchKeyboardTransition,
  searchStyle,
  type ClassNameComponent,
  type SearchInterface,
  type SearchProps,
} from '@udixio/core';
import {
  createMenuController,
  createSearchOutsideDismissController,
  createSearchResultsTransitionController,
  type MenuController,
  type SearchOutsideDismissController,
  type SearchResultsTransitionController,
} from '@udixio/core/dom';
import { iClose } from '@udixio/icons-rounded-400/close';
import { iSearch } from '@udixio/icons-rounded-400/search';
import { Icon } from '../icon/icon';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';
import { StateLayer } from '../state-layer/state-layer';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

let nextSearchId = 0;

/**
 * Search lets people enter a query and optionally browse projected suggestions
 * or results in an inline Material 3 contained results surface.
 *
 * @status beta
 * @category Input
 * @devx `query`/`defaultQuery` and `expanded`/`defaultExpanded` mirror the React adapter; use the
 * `queryChange`, `expandedChange`, and `searchSubmit` outputs for Angular bindings. Search renders
 * the inline contained variant; compose it with `SideSheet`, a dialog, or another surface primitive
 * when the surrounding feature owns modal presentation and docked/full-screen layout. Project one
 * or two interactive trailing controls, normally `udx-icon-button[search-trailing]`; do not project
 * a bare icon. `leadingIcon` is decorative; navigation and dismissal belong to the surrounding
 * `SideSheet` or surface. The built-in clear action occupies one of Material 3's two trailing
 * action slots while it is visible. Project selectable results with `role="option"` when using the
 * default listbox results role. The inline results surface uses one shared Anime.js height/opacity
 * transition; reduced motion applies the final state immediately. A pointer outside Search closes
 * the local results surface when expanded; surrounding modal dismissal remains owned by `SideSheet`
 * or the parent surface.
 * @a11y Renders a `search` landmark and a named `input[type="search"]`; the leading icon is
 * decorative and hidden from assistive technology, while projected listbox results share
 * Arrow Up/Down, Enter, and Escape focus behavior with React.
 * @limitations Search does not filter or render result data itself and does not own modal layout
 * or responsive presentation.
 */
@Component({
  selector: 'udx-search',
  standalone: true,
  imports: [Icon, StateLayer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div
      #root
      [class]="styles()['search']"
      [attr.aria-label]="label()"
      role="search"
      (keydown)="handleRootKeyDown($event)"
    >
      <div [class]="styles()['container']">
        <div
          [class]="styles()['inputField']"
          [attr.aria-disabled]="disabled() ? 'true' : null"
          (click)="handleInputFieldClick($event)"
        >
          <udx-state-layer
            [className]="styles()['stateLayer']"
            colorName="on-surface"
            stateClassName="state-ripple-group-[search-input]"
          />
          <span [class]="styles()['leadingIcon']" aria-hidden="true">
            <udx-icon [icon]="resolvedLeadingIcon()" className="size-6" />
          </span>

          <input
            #inputElement
            [id]="resolvedId()"
            [class]="styles()['input']"
            type="search"
            [attr.role]="hasResults() ? 'combobox' : 'searchbox'"
            [attr.aria-label]="label()"
            [attr.aria-autocomplete]="hasResults() ? 'list' : null"
            [attr.aria-controls]="hasResults() ? resultsId() : null"
            [attr.aria-expanded]="hasResults() ? isExpanded() : null"
            [attr.aria-haspopup]="
              hasResults() && resultsRole() === 'dialog' ? 'dialog' : null
            "
            [name]="name() || null"
            [value]="queryState.value()"
            [placeholder]="placeholder()"
            [autocomplete]="autoComplete()"
            [attr.inputmode]="inputMode() || null"
            [attr.maxlength]="maxLength() ?? null"
            [attr.minlength]="minLength() ?? null"
            [required]="required()"
            [readonly]="readOnly()"
            [attr.spellcheck]="spellCheck()"
            [disabled]="disabled()"
            (input)="handleInput($event)"
            (focus)="handleFocus()"
            (blur)="handleBlur()"
            (keydown)="handleInputKeyDown($event)"
          />

          <div [class]="styles()['trailingActions']">
            @if (clearable() && hasQuery()) {
              <button
                type="button"
                [class]="styles()['clearButton']"
                [attr.aria-label]="clearLabel()"
                [disabled]="disabled()"
                (click)="handleClear()"
              >
                <udx-state-layer
                  [className]="styles()['stateLayer']"
                  colorName="on-surface"
                  stateClassName="state-ripple-group-[search-clear]"
                />
                <udx-icon [icon]="clearIcon" className="size-6" />
              </button>
            }
            <ng-content select="[search-trailing]" />
          </div>
        </div>

        <div
          #results
          [id]="resultsId()"
          [class]="styles()['results']"
          [hidden]="!hasResults()"
          [attr.role]="hasResults() ? resultsRole() : null"
          [attr.aria-label]="hasResults() ? resultsLabel() : null"
          [attr.aria-hidden]="isExpanded() && hasResults() ? null : 'true'"
          [attr.inert]="isExpanded() && hasResults() ? null : ''"
          style="height: 0; opacity: 0"
        >
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class Search implements OnInit {
  readonly label = input.required<string>();
  readonly query = input<string | undefined>();
  readonly defaultQuery = input('');
  readonly expanded = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly defaultExpanded = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Search');
  readonly leadingIcon = input<SearchProps['leadingIcon']>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly id = input<string>();
  readonly autoComplete = input('off');
  readonly autoFocus = input(false, { transform: booleanAttribute });
  readonly inputMode = input<SearchProps['inputMode']>();
  readonly maxLength = input<number>();
  readonly minLength = input<number>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly spellCheck = input(true, { transform: booleanAttribute });
  readonly resultsRole = input<SearchProps['resultsRole']>('listbox');
  readonly resultsLabel = input('Search suggestions');
  readonly clearLabel = input('Clear search');
  readonly className = input<string | ClassNameComponent<SearchInterface>>();

  /** Emits each accepted query transition and supports `[(query)]`. */
  readonly queryChange = output<string>();
  /** Emits each accepted expanded-state transition and supports `[(expanded)]`. */
  readonly expandedChange = output<boolean>();
  /** Emits the current query when the user submits the search action. */
  readonly searchSubmit = output<string>();
  /** Emits when the search input gains focus. */
  readonly focused = output<void>();
  /** Emits when the search input loses focus. */
  readonly blurred = output<void>();

  protected readonly clearIcon = iClose;
  private readonly fallbackId = `search-${nextSearchId++}`;
  private readonly inputElement =
    viewChild.required<ElementRef<HTMLInputElement>>('inputElement');
  private readonly root =
    viewChild.required<ElementRef<HTMLDivElement>>('root');
  private readonly results =
    viewChild.required<ElementRef<HTMLDivElement>>('results');
  private menuControllerInstance: MenuController | null = null;
  private dismissControllerInstance: SearchOutsideDismissController | null =
    null;
  private resultsTransitionControllerInstance: SearchResultsTransitionController | null =
    null;
  private readonly pendingFocus = signal<'first' | 'last' | null>(null);
  private readonly suppressExpandOnFocus = signal(false);
  private autoFocusApplied = false;

  protected readonly queryState = createControllableState({
    value: this.query,
    defaultValue: this.defaultQuery,
    onChange: (query) => {
      this.queryChange.emit(query);
    },
    componentName: 'Search',
    stateName: 'query',
  });
  private readonly expandedState = createControllableState({
    value: this.expanded,
    defaultValue: this.defaultExpanded,
    onChange: (expanded) => {
      this.expandedChange.emit(expanded);
    },
    componentName: 'Search',
    stateName: 'expanded',
  });

  protected readonly isFocused = signal(false);
  protected readonly isExpanded = this.expandedState.value;
  protected readonly hasQuery = computed(
    () => this.queryState.value().length > 0,
  );
  protected readonly hasResults = signal(false);
  private initialProjectedContentResolved = false;
  private initialProjectedContentPresent = false;
  protected readonly resolvedId = computed(() => this.id() ?? this.fallbackId);
  protected readonly resultsId = computed(() => `${this.resolvedId()}-results`);
  protected readonly resolvedLeadingIcon = computed(
    () => this.leadingIcon() ?? iSearch,
  );
  protected readonly styles = createStyle(searchStyle, () => ({
    label: this.label(),
    query: this.query(),
    defaultQuery: this.defaultQuery(),
    onQueryChange: undefined,
    expanded: this.expanded(),
    defaultExpanded: this.defaultExpanded(),
    onExpandedChange: undefined,
    onSearch: undefined,
    placeholder: this.placeholder(),
    leadingIcon: this.leadingIcon(),
    disabled: this.disabled(),
    clearable: this.clearable(),
    name: this.name(),
    id: this.id(),
    autoComplete: this.autoComplete(),
    autoFocus: this.autoFocus(),
    inputMode: this.inputMode(),
    maxLength: this.maxLength(),
    minLength: this.minLength(),
    required: this.required(),
    readOnly: this.readOnly(),
    spellCheck: this.spellCheck(),
    resultsRole: this.resultsRole(),
    resultsLabel: this.resultsLabel(),
    clearLabel: this.clearLabel(),
    onFocus: undefined,
    onBlur: undefined,
    isFocused: this.isFocused(),
    isExpanded: this.isExpanded(),
    hasQuery: this.hasQuery(),
    hasResults: this.hasResults(),
    className: this.className(),
  }));

  constructor() {
    afterRenderEffect((onCleanup) => {
      const results = this.results().nativeElement;
      const updateProjectedContent = (): void => {
        const hasProjectedContent =
          results.children.length > 0 || Boolean(results.textContent?.trim());
        if (!this.initialProjectedContentResolved) {
          this.initialProjectedContentResolved = true;
          this.initialProjectedContentPresent = hasProjectedContent;
        }
        if (this.hasResults() !== hasProjectedContent) {
          this.hasResults.set(hasProjectedContent);
        }
      };
      updateProjectedContent();

      const MutationObserverConstructor =
        results.ownerDocument.defaultView?.MutationObserver ??
        globalThis.MutationObserver;
      if (MutationObserverConstructor) {
        const observer = new MutationObserverConstructor(
          updateProjectedContent,
        );
        observer.observe(results, {
          childList: true,
          characterData: true,
          subtree: true,
        });
        onCleanup(() => observer.disconnect());
      }
    });

    afterRenderEffect((onCleanup) => {
      const results = this.results().nativeElement;

      if (
        !this.hasResults() ||
        !this.isExpanded() ||
        this.resultsRole() !== 'listbox'
      ) {
        return;
      }

      const controller = createMenuController(results, {
        onEscape: () => this.closeAndRestoreFocus(),
      });
      this.menuControllerInstance = controller;
      onCleanup(() => {
        controller.destroy();
        if (this.menuControllerInstance === controller) {
          this.menuControllerInstance = null;
        }
      });

      const focus = this.pendingFocus();
      if (focus) {
        this.pendingFocus.set(null);
        if (focus === 'first') controller.focusFirst();
        else controller.focusLast();
      }
    });

    afterRenderEffect((onCleanup) => {
      const results = this.results().nativeElement;
      if (!this.hasResults()) return;

      const currentExpanded = untracked(() => this.isExpanded());
      const animateOnConnect =
        currentExpanded && !this.initialProjectedContentPresent;
      const controller = createSearchResultsTransitionController({
        element: results,
        open: animateOnConnect ? false : currentExpanded,
      });
      this.resultsTransitionControllerInstance = controller;
      onCleanup(() => {
        controller.destroy();
        if (!this.hasResults()) results.hidden = true;
        if (this.resultsTransitionControllerInstance === controller) {
          this.resultsTransitionControllerInstance = null;
        }
      });
      if (animateOnConnect) controller.setOpen(true);
    });

    afterRenderEffect(() => {
      if (!this.hasResults()) return;
      this.resultsTransitionControllerInstance?.setOpen(this.isExpanded());
    });

    afterRenderEffect((onCleanup) => {
      const root = this.root().nativeElement;
      if (!this.hasResults() || !this.isExpanded()) return;

      const controller = createSearchOutsideDismissController({
        root,
        onDismiss: () => this.requestExpansion(false),
      });
      this.dismissControllerInstance = controller;
      onCleanup(() => {
        controller.destroy();
        if (this.dismissControllerInstance === controller) {
          this.dismissControllerInstance = null;
        }
      });
    });

    afterRenderEffect(() => {
      if (!this.autoFocus() || this.autoFocusApplied) return;
      this.autoFocusApplied = true;
      queueMicrotask(() => {
        if (!this.disabled()) this.inputElement().nativeElement.focus();
      });
    });
  }

  ngOnInit(): void {
    this.queryState.initialize();
    this.expandedState.initialize();
  }

  protected handleInput(event: Event): void {
    if (this.disabled()) return;
    this.queryState.set((event.target as HTMLInputElement).value);
  }

  protected handleFocus(): void {
    if (this.disabled()) return;
    this.isFocused.set(true);
    this.focused.emit();
    if (this.suppressExpandOnFocus()) {
      this.suppressExpandOnFocus.set(false);
      return;
    }
    this.requestExpansion(true);
  }

  protected handleBlur(): void {
    this.isFocused.set(false);
    this.blurred.emit();
  }

  protected handleInputKeyDown(event: KeyboardEvent): void {
    const transition = getSearchKeyboardTransition({
      disabled: this.disabled(),
      isExpanded: this.isExpanded(),
      hasResults: this.hasResults(),
      key: event.key,
    });

    if (transition.blocked) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (transition.nextExpanded !== undefined) {
      event.preventDefault();
      this.pendingFocus.set(transition.focus ?? null);
      this.requestExpansion(transition.nextExpanded);
    } else if (transition.focus && this.menuControllerInstance) {
      event.preventDefault();
      if (transition.focus === 'first')
        this.menuControllerInstance.focusFirst();
      else if (transition.focus === 'last')
        this.menuControllerInstance.focusLast();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const query = this.queryState.value();
      this.searchSubmit.emit(query);
    }
  }

  protected handleRootKeyDown(event: KeyboardEvent): void {
    if (this.resultsRole() !== 'dialog') return;
    if (event.key !== 'Escape' || !this.isExpanded()) return;
    if (event.target === this.inputElement().nativeElement) return;
    event.preventDefault();
    event.stopPropagation();
    this.closeAndRestoreFocus();
  }

  protected handleInputFieldClick(event: MouseEvent): void {
    if (this.disabled()) return;
    const target = event.target;
    if (target instanceof Element && target.closest('button, input, a')) {
      return;
    }
    this.inputElement().nativeElement.focus();
  }

  protected handleClear(): void {
    if (this.disabled()) return;
    this.queryState.set('');
    this.inputElement().nativeElement.focus();
  }

  private requestExpansion(nextExpanded: boolean): void {
    const transition = getSearchExpansionTransition({
      disabled: this.disabled(),
      isExpanded: this.isExpanded(),
      nextExpanded,
    });
    if (!transition.blocked) this.expandedState.set(transition.nextExpanded);
  }

  private closeAndRestoreFocus(): void {
    this.requestExpansion(false);
    this.suppressExpandOnFocus.set(true);
    queueMicrotask(() => this.inputElement().nativeElement.focus());
  }
}
