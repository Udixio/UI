import { type ClassNameComponent, cx, defaultClassNames } from '../utils';
import type { FabMenuInterface } from '../interfaces/fab-menu.interface';

const fabMenuConfig: ClassNameComponent<FabMenuInterface> = ({
  disabled,
  isOpen,
  variant,
}) => ({
  fabMenu: cx('relative inline-flex flex-col items-end'),
  triggerSizer: cx('invisible pointer-events-none'),
  triggerPositioner: cx('absolute right-0 top-0'),
  fab: cx(
    'transition-[background-color,color] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
    disabled && 'pointer-events-none',
    isOpen && 'rounded-full shadow-none hover:shadow-none',
  ),
  actions: cx(
    'absolute bottom-[calc(100%_+_8px)] right-0 z-10 flex min-w-max flex-col items-end gap-1',
    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
  ),
  actionContainer: cx('inline-flex origin-bottom-right'),
  action: cx(
    'max-w-full overflow-hidden text-nowrap',
    variant === 'primary' && 'bg-primary-container text-on-primary-container',
    variant === 'secondary' &&
      'bg-secondary-container text-on-secondary-container',
    variant === 'tertiary' &&
      'bg-tertiary-container text-on-tertiary-container',
  ),
  actionStateLayer: cx(
    variant === 'primary' &&
      '[--default-color:var(--color-on-primary-container)]',
    variant === 'secondary' &&
      '[--default-color:var(--color-on-secondary-container)]',
    variant === 'tertiary' &&
      '[--default-color:var(--color-on-tertiary-container)]',
  ),
});

export const fabMenuStyle = defaultClassNames<FabMenuInterface>(
  'fabMenu',
  fabMenuConfig,
);
