import type { Icon } from '../icon';

export type SearchInputMode =
  'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';

/** Identifies the kind of popup used for projected suggestions or results. */
export type SearchResultsRole = 'listbox' | 'dialog';

export type SearchProps = {
  /** Accessible name for the native search input. */
  label: string;
  /** Controlled query. Providing it makes the search controlled for its lifetime. */
  query?: string;
  /** Initial query for uncontrolled usage. */
  defaultQuery?: string;
  /** Called once for each accepted query transition. */
  onQueryChange?: (query: string) => void;
  /** Controlled expanded state. Providing it makes the state controlled for its lifetime. */
  expanded?: boolean;
  /** Initial expanded state for uncontrolled usage. @default false */
  defaultExpanded?: boolean;
  /** Called once for each accepted expanded-state transition. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Called when the user submits the current query with the search action. */
  onSearch?: (query: string) => void;
  /** Hint displayed while the query is empty. @default 'Search' */
  placeholder?: string;
  /** Icon shown at the leading edge; the search icon is used by default. */
  leadingIcon?: Icon;
  /** Prevents query editing and activation. */
  disabled?: boolean;
  /** Clears the query when the clear action is activated. @default true */
  clearable?: boolean;
  /** Native form name forwarded to the search input. */
  name?: string;
  /** Id of the search input. Auto-generated if not provided. */
  id?: string;
  /** Native autocomplete hint. @default 'off' */
  autoComplete?: string;
  /** Focuses the input once, on mount. */
  autoFocus?: boolean;
  /** Native input mode hint. */
  inputMode?: SearchInputMode;
  /** Native maximum query length. */
  maxLength?: number;
  /** Native minimum query length. */
  minLength?: number;
  /** Requires a non-empty query when the input participates in a form. */
  required?: boolean;
  /** Prevents editing while preserving the search value and semantics. */
  readOnly?: boolean;
  /** Native spell-check preference. @default true */
  spellCheck?: boolean;
  /** Role used by the projected results surface. @default 'listbox' */
  resultsRole?: SearchResultsRole;
  /** Accessible name for the projected results surface. @default 'Search suggestions' */
  resultsLabel?: string;
  /** Accessible name of the clear action. @default 'Clear search' */
  clearLabel?: string;
  /** Fires when the input gains focus. */
  onFocus?: () => void;
  /** Fires when the input loses focus. */
  onBlur?: () => void;
};

export type SearchStates = {
  /** The native search input currently has focus. */
  isFocused: boolean;
  /** The local projected results surface is expanded. */
  isExpanded: boolean;
  /** The resolved query is non-empty. */
  hasQuery: boolean;
  /** Projected suggestions or results are available. */
  hasResults: boolean;
};

export interface SearchInterface {
  type: 'search';
  props: SearchProps;
  states: SearchStates;
  elements: [
    'search',
    'container',
    'inputField',
    'input',
    'leadingIcon',
    'trailingActions',
    'clearButton',
    'results',
  ];
}
