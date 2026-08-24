import React, {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { iClose } from '@udixio/icons-rounded-400/close';
import { iSearch } from '@udixio/icons-rounded-400/search';
import {
  classNames,
  getSearchExpansionTransition,
  getSearchKeyboardTransition,
  searchStyle,
  type ReactProps,
  type SearchInterface,
} from '@udixio/core';
import { createMenuController, type MenuController } from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { Icon } from '../icon';

export type ReactSearchProps = Omit<
  ReactProps<SearchInterface>,
  | 'children'
  | 'ref'
  | 'onChange'
  | 'onClick'
  | 'onFocus'
  | 'onBlur'
  | 'onKeyDown'
> & {
  children?: ReactNode;
  /** Interactive trailing controls, normally one or two `IconButton` instances. */
  trailingActions?: ReactNode;
  style?: CSSProperties;
  ref?: React.Ref<HTMLInputElement>;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
};

export const useSearchStyle = createUseStyle(searchStyle);

/**
 * Search lets people enter a query and optionally browse projected suggestions
 * or results in a projected Material 3 results surface.
 *
 * @status beta
 * @category Input
 * @devx
 * - `query` is controlled; `defaultQuery` initializes uncontrolled usage.
 * - `expanded` is controlled; `defaultExpanded` initializes uncontrolled usage.
 * - Search is layout-neutral. Use a `SideSheet`, dialog, or another surface primitive to decide
 *   where the search and its projected results are presented.
 * - Use `trailingActions` for one or two interactive trailing controls, normally `IconButton`
 *   instances. Do not pass a bare `Icon`; a trailing icon shown in the Search bar is an action.
 * - When the built-in clear action is visible, it occupies one of Material 3's two trailing
 *   action slots; provide at most one additional trailing action in that state.
 * - Project suggestions or results as children. For listbox semantics, give each selectable child
 *   `role="option"` and a `tabIndex` of `-1`.
 * - `onSearch` receives the current query when the user presses Enter or the search IME action.
 * @a11y
 * - Uses a `search` landmark and `input[type="search"]` with a required accessible name.
 * - When projected content exists, the input becomes a WAI-ARIA combobox linked to the results
 *   surface; Arrow Up/Down, Enter, and Escape preserve the shared focus model.
 * - The clear and leading controls have explicit accessible names and retain 48 px touch targets.
 * @limitations
 * - The component does not filter or render result data itself; consumers own the projected result
 *   content and should provide `role="option"` children when using the default listbox role.
 * - The component does not own modal layout or responsive presentation. Compose it with `SideSheet`
 *   or another surface when the surrounding feature must block and inert the rest of the application.
 */
export const Search = ({
  label,
  query: queryProp,
  defaultQuery = '',
  onQueryChange,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  onSearch,
  placeholder = 'Search',
  leadingIcon,
  trailingActions,
  disabled = false,
  clearable = true,
  name,
  id: idProp,
  autoComplete = 'off',
  autoFocus,
  inputMode,
  maxLength,
  minLength,
  required,
  readOnly,
  spellCheck = true,
  resultsRole = 'listbox',
  resultsLabel = 'Search suggestions',
  clearLabel = 'Clear search',
  onFocus,
  onBlur,
  className,
  style,
  ref,
  children,
  onClick,
  onKeyDown,
  ...restProps
}: ReactSearchProps) => {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const resultsId = `${inputId}-results`;
  const resultChildren = React.Children.toArray(children);
  const hasResults = resultChildren.length > 0;
  const hasTrailingActions = React.Children.count(trailingActions) > 0;

  const [query, setQuery] = useControllableState({
    value: queryProp,
    defaultValue: defaultQuery,
    onChange: onQueryChange,
    componentName: 'Search',
    stateName: 'query',
  });
  const [isExpanded, setExpanded] = useControllableState({
    value: expandedProp,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
    componentName: 'Search',
    stateName: 'expanded',
  });
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const forwardedInputRef = useRef(ref);
  const menuControllerRef = useRef<MenuController | null>(null);
  const pendingFocusRef = useRef<'first' | 'last' | null>(null);
  const suppressExpandOnFocusRef = useRef(false);

  forwardedInputRef.current = ref;

  useEffect(() => {
    const forwardedRef = forwardedInputRef.current;
    if (typeof forwardedRef === 'function') forwardedRef(inputRef.current);
    else if (forwardedRef) forwardedRef.current = inputRef.current;
  }, [ref]);

  useEffect(() => {
    const results = resultsRef.current;
    if (!results || !isExpanded || !hasResults || resultsRole !== 'listbox') {
      menuControllerRef.current?.destroy();
      menuControllerRef.current = null;
      return undefined;
    }

    const controller = createMenuController(results, {
      onEscape: () => {
        setExpanded(false);
        suppressExpandOnFocusRef.current = true;
        queueMicrotask(() => inputRef.current?.focus());
      },
    });
    menuControllerRef.current = controller;

    const pendingFocus = pendingFocusRef.current;
    if (pendingFocus) {
      pendingFocusRef.current = null;
      if (pendingFocus === 'first') controller.focusFirst();
      else controller.focusLast();
    }

    return () => {
      controller.destroy();
      if (menuControllerRef.current === controller) {
        menuControllerRef.current = null;
      }
    };
  }, [hasResults, isExpanded, resultsRole, setExpanded]);

  const styles = useSearchStyle({
    label,
    query: queryProp,
    defaultQuery,
    onQueryChange,
    expanded: expandedProp,
    defaultExpanded,
    onExpandedChange,
    onSearch,
    placeholder,
    leadingIcon,
    disabled,
    clearable,
    name,
    id: idProp,
    autoComplete,
    autoFocus,
    inputMode,
    maxLength,
    minLength,
    required,
    readOnly,
    spellCheck,
    resultsRole,
    resultsLabel,
    clearLabel,
    onFocus,
    onBlur,
    isFocused,
    isExpanded,
    hasQuery: query.length > 0,
    hasResults,
    className,
  });

  const requestExpansion = (nextExpanded: boolean): void => {
    const transition = getSearchExpansionTransition({
      disabled,
      isExpanded,
      nextExpanded,
    });
    if (!transition.blocked) setExpanded(transition.nextExpanded);
  };

  const handleFocus = (): void => {
    if (disabled) return;
    setIsFocused(true);
    onFocus?.();
    if (suppressExpandOnFocusRef.current) {
      suppressExpandOnFocusRef.current = false;
      return;
    }
    requestExpansion(true);
  };

  const handleBlur = (): void => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    const transition = getSearchKeyboardTransition({
      disabled,
      isExpanded,
      hasResults,
      key: event.key,
    });

    if (transition.blocked) {
      event.preventDefault();
      event.stopPropagation();
      onKeyDown?.(event as unknown as KeyboardEvent<HTMLElement>);
      return;
    }

    if (transition.nextExpanded !== undefined) {
      event.preventDefault();
      pendingFocusRef.current =
        transition.focus === 'last'
          ? 'last'
          : transition.focus === 'first'
            ? 'first'
            : null;
      requestExpansion(transition.nextExpanded);
    } else if (transition.focus && menuControllerRef.current) {
      event.preventDefault();
      if (transition.focus === 'first') menuControllerRef.current.focusFirst();
      else if (transition.focus === 'last')
        menuControllerRef.current.focusLast();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      onSearch?.(query);
    }

    onKeyDown?.(event as unknown as KeyboardEvent<HTMLElement>);
  };

  const handleLeadingClick = (): void => {
    if (disabled) return;
    requestExpansion(true);
    inputRef.current?.focus();
  };

  const handleClear = (): void => {
    if (disabled) return;
    setQuery('');
    inputRef.current?.focus();
  };

  const resolvedLeadingIcon = leadingIcon ?? iSearch;

  return (
    <div
      {...restProps}
      className={styles.search}
      style={style}
      aria-label={label}
      role="search"
      onClick={(event) => onClick?.(event)}
    >
      <div className={styles.container}>
        <div className={styles.inputField}>
          <button
            type="button"
            className={styles.leadingIcon}
            aria-label={label}
            disabled={disabled}
            onClick={handleLeadingClick}
          >
            <Icon icon={resolvedLeadingIcon} className="size-6" />
          </button>

          <input
            ref={inputRef}
            id={inputId}
            className={classNames(styles.input)}
            type="search"
            role={hasResults ? 'combobox' : 'searchbox'}
            aria-label={label}
            aria-autocomplete={hasResults ? 'list' : undefined}
            aria-controls={hasResults ? resultsId : undefined}
            aria-expanded={hasResults ? isExpanded : undefined}
            aria-haspopup={
              hasResults && resultsRole === 'dialog' ? 'dialog' : undefined
            }
            name={name}
            value={query}
            placeholder={placeholder}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            inputMode={
              inputMode as React.HTMLAttributes<HTMLInputElement>['inputMode']
            }
            maxLength={maxLength}
            minLength={minLength}
            required={required}
            readOnly={readOnly}
            spellCheck={spellCheck}
            disabled={disabled}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleInputKeyDown}
          />

          {clearable && query.length > 0 && (
            <button
              type="button"
              className={styles.clearButton}
              aria-label={clearLabel}
              disabled={disabled}
              onClick={handleClear}
            >
              <Icon icon={iClose} className="size-6" />
            </button>
          )}

          {hasTrailingActions && (
            <div className={styles.trailingActions}>{trailingActions}</div>
          )}
        </div>

        {hasResults && isExpanded && (
          <div
            ref={resultsRef}
            id={resultsId}
            className={styles.results}
            role={resultsRole}
            aria-label={resultsLabel}
          >
            {resultChildren}
          </div>
        )}
      </div>
    </div>
  );
};
