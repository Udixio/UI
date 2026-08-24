import { type ClassNameComponent, cx, defaultClassNames } from '../utils';
import type { SearchInterface } from '../interfaces';

const searchConfig: ClassNameComponent<SearchInterface> = ({
  disabled,
  clearable,
  isFocused,
  hasQuery,
  hasResults,
}) => ({
  search: cx('relative block w-full max-w-[720px]'),
  container: cx(
    'group/search relative flex w-full flex-col overflow-hidden rounded-[28px] bg-surface-container-high text-on-surface shadow-2',
    'transition-[border-radius,box-shadow] duration-300 motion-reduce:transition-none',
    'focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary',
    {
      'opacity-[.38]': disabled,
    },
  ),
  inputField: cx(
    'flex min-h-14 w-full shrink-0 items-center gap-1 px-3',
    {
      'cursor-not-allowed': disabled,
      'cursor-text': !disabled,
    },
    isFocused && !disabled && 'bg-on-surface/[0.04]',
  ),
  input: cx(
    'min-w-0 flex-1 bg-transparent px-2 text-body-large text-on-surface outline-none',
    'placeholder:text-on-surface-variant disabled:cursor-not-allowed',
    '[&::-webkit-search-cancel-button]:appearance-none',
  ),
  leadingIcon: cx(
    'inline-flex size-12 shrink-0 items-center justify-center rounded-full',
    'text-on-surface-variant outline-none transition-colors duration-200 motion-reduce:transition-none',
    'hover:bg-on-surface/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-current',
  ),
  trailingActions: cx(
    'flex shrink-0 items-center gap-1',
  ),
  clearButton: cx(
    'inline-flex size-12 shrink-0 items-center justify-center rounded-full',
    'text-on-surface-variant outline-none transition-colors duration-200 motion-reduce:transition-none',
    'hover:bg-on-surface/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-current',
    { hidden: !clearable || !hasQuery },
  ),
  results: cx(
    'min-h-0 max-h-[min(40rem,66dvh)] flex-1 overflow-y-auto px-2 pb-4',
    'border-outline-variant bg-surface-container-high',
    {
      'border-t': hasResults,
      'max-h-[min(40rem,66dvh)]': true,
    },
  ),
});

export const searchStyle = defaultClassNames<SearchInterface>(
  'search',
  searchConfig,
);
