import {
  type ClassNameComponent,
  classNames,
  defaultClassNames,
} from '../utils';
import type { FabInterface } from '../interfaces/fab.interface';

const fabConfig: ClassNameComponent<FabInterface> = ({
  size,
  variant,
  extended,
  disabled,
}) => ({
  fab: classNames(
    'relative inline-flex min-h-12 min-w-12 items-center justify-center overflow-hidden outline-none group/fab',
    'shadow-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
    disabled ? 'cursor-default shadow-none' : 'cursor-pointer hover:shadow-4',
    size === 'small' && 'rounded-[12px] p-2',
    size === 'medium' && 'rounded-[16px] p-4',
    size === 'large' && 'rounded-[28px] p-[30px]',
    extended && {
      'gap-2 px-4': size === 'small',
      'gap-3 px-6': size === 'medium',
      'gap-4 px-8': size === 'large',
    },
    variant === 'primary' && 'bg-primary text-on-primary',
    variant === 'secondary' && 'bg-secondary text-on-secondary',
    variant === 'tertiary' && 'bg-tertiary text-on-tertiary',
    variant === 'primaryContainer' &&
      'bg-primary-container text-on-primary-container',
    variant === 'secondaryContainer' &&
      'bg-secondary-container text-on-secondary-container',
    variant === 'tertiaryContainer' &&
      'bg-tertiary-container text-on-tertiary-container',
    disabled && 'bg-on-surface/[0.12] text-on-surface/[0.38]',
  ),
  touchTarget: classNames(
    'pointer-events-none absolute left-1/2 top-1/2 h-12 min-w-12 w-full -translate-x-1/2 -translate-y-1/2',
  ),
  stateLayer: classNames('overflow-hidden'),
  icon: classNames(
    'pointer-events-none shrink-0',
    (size === 'small' || size === 'medium') && 'size-6',
    size === 'large' && 'size-9',
  ),
  label: classNames(
    'text-nowrap',
    size === 'small' && 'text-title-medium',
    size === 'medium' && 'text-title-large',
    size === 'large' && 'text-headline-small',
  ),
});

export const fabStyle = defaultClassNames<FabInterface>('fab', fabConfig);
