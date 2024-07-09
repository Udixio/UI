import { ClassNameComponent, StylesHelper } from '../../utils';
import { FabElement, FabState } from './Fab';

export const fabStyle: ClassNameComponent<FabState, FabElement> = ({
  label,
  icon,
  size,
  variant,
  isExtended,
}) => ({
  fab: StylesHelper.classNames([
    'flex transition-all duration-300 shadow-3 hover:shadow-4 group overflow-hidden outline-none items-center',

    {
      'rounded-[12px]': size == 'small' && !isExtended,
      'rounded-[16px]': size == 'medium' || isExtended,
      'rounded-[28px]': size == 'large' && !isExtended,
    },
    {
      'p-2': size == 'small' && !isExtended,
      'p-4': size == 'medium' || isExtended,
      'p-[30px]': size == 'large' && !isExtended,
    },
    { applyWhen: variant === 'surface', styles: ['bg-surface-container'] },
    { applyWhen: variant === 'primary', styles: ['bg-primary-container'] },
    { applyWhen: variant === 'secondary', styles: ['bg-secondary-container'] },
    { applyWhen: variant === 'tertiary', styles: ['bg-tertiary-container'] },
  ]),
  stateLayer: StylesHelper.classNames([
    'absolute w-full h-full overflow-hidden left-1/2 top-1/2 transform -translate-y-1/2 -translate-x-1/2',
    {
      applyWhen: variant === 'surface',
      styles: [
        'group-hover:hover-state-primary group-focus:focus-state-primary',
      ],
    },
    {
      applyWhen: variant === 'primary',
      styles: [
        'group-hover:hover-state-on-primary-container group-focus-visible:focus-state-on-primary-container',
      ],
    },
    {
      applyWhen: variant === 'secondary',
      styles: [
        'group-hover:hover-state-on-secondary-container group-focus-visible:focus-state-on-secondary-container',
      ],
    },
    {
      applyWhen: variant === 'tertiary',
      styles: [
        'group-hover:hover-state-on-tertiary-container group-focus-visible:focus-state-on-tertiary-container',
      ],
    },
  ]),

  icon: StylesHelper.classNames([
    {
      'h-6 w-6': size == 'small' || size == 'medium' || isExtended,
      'h-9 w-9': size == 'large' && !isExtended,
    },
    {
      applyWhen: variant === 'surface',
      styles: ['text-primary'],
    },
    {
      applyWhen: variant === 'primary',
      styles: ['text-on-primary-container'],
    },
    {
      applyWhen: variant === 'secondary',
      styles: ['text-on-secondary-container'],
    },
    {
      applyWhen: variant === 'tertiary',
      styles: ['text-on-tertiary-container'],
    },
  ]),

  label: StylesHelper.classNames([
    'text-label-large text-nowrap',
    {
      applyWhen: variant === 'surface',
      styles: ['text-primary'],
    },
    {
      applyWhen: variant === 'primary',
      styles: ['text-on-primary-container'],
    },
    {
      applyWhen: variant === 'secondary',
      styles: ['text-on-secondary-container'],
    },
    {
      applyWhen: variant === 'tertiary',
      styles: ['text-on-tertiary-container'],
    },
  ]),
});
