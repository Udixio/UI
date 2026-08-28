import { type ClassNameComponent, cx, defaultClassNames } from '../utils';
import type { SearchInterface } from '../interfaces';

const searchConfig: ClassNameComponent<SearchInterface> = ({
  disabled,
  clearable,
  isFocused,
  isExpanded,
  hasQuery,
  hasResults,
}) => ({
  search: cx('relative block w-full min-w-[min(360px,100%)] max-w-[720px]'),
  container: cx(
    'group/search relative flex w-full flex-col rounded-[28px] bg-surface-container-high text-on-surface outline outline-[3px] outline-offset-2 transition-[outline-color] duration-200 ease-out motion-reduce:transition-none',
    isExpanded && hasResults ? 'gap-0.5' : 'gap-0',
    isFocused && !disabled ? 'outline-secondary' : 'outline-transparent',
    {
      'opacity-[.38]': disabled,
    },
  ),
  inputField: cx(
    'group/search-input relative flex min-h-14 w-full shrink-0 items-center gap-1 rounded-full px-6',
    {
      'cursor-not-allowed': disabled,
      'cursor-text': !disabled,
    },
  ),
  input: cx(
    'min-w-0 flex-1 bg-transparent px-0 text-body-large !text-[1rem] !leading-6 text-on-surface outline-none',
    'placeholder:text-on-surface-variant disabled:cursor-not-allowed',
    '[&::-webkit-search-cancel-button]:appearance-none',
  ),
  leadingIcon: cx(
    'pointer-events-none inline-flex size-12 shrink-0 items-center justify-center text-on-surface',
  ),
  trailingActions: cx('flex shrink-0 items-center gap-0 empty:hidden'),
  clearButton: cx(
    'group/search-clear relative inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full outline outline-[3px] outline-offset-2 outline-transparent transition-[outline-color] duration-200 ease-out motion-reduce:transition-none',
    'text-on-surface-variant focus-visible:outline-secondary',
    { hidden: !clearable || !hasQuery },
  ),
  results: cx(
    'min-h-0 overflow-hidden rounded-xl bg-surface-container-high px-2',
    isExpanded && hasResults ? 'pb-4' : 'pb-0',
  ),
  stateLayer: cx('overflow-hidden motion-reduce:transition-none'),
});

export const searchStyle = defaultClassNames<SearchInterface>(
  'search',
  searchConfig,
);
