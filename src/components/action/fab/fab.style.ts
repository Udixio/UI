import { classNames, defaultClassNames } from '@utils/index';
import {
  FabBaseProps,
  FabElements,
  FabProps,
  FabStates,
} from '@components/action/fab/fab.interface';

export const fabStyle = defaultClassNames<FabBaseProps & FabStates, FabElements>({
  defaultClassName: ({ size, variant, isExtended }) => ({
    fab: classNames(
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
      variant === 'surface' && 'bg-surface-container',
      variant === 'primary' && 'bg-primary-container',
      variant === 'secondary' && 'bg-secondary-container',
      variant === 'tertiary' && 'bg-tertiary-container'
    ),
    stateLayer: classNames(
      'absolute w-full h-full overflow-hidden left-1/2 top-1/2 transform -translate-y-1/2 -translate-x-1/2',
      variant === 'surface' &&
        'group-hover:hover-state-primary group-focus:focus-state-primary',
      variant === 'primary' &&
        'group-hover:hover-state-on-primary-container group-focus-visible:focus-state-on-primary-container',
      variant === 'secondary' &&
        'group-hover:hover-state-on-secondary-container group-focus-visible:focus-state-on-secondary-container',
      variant === 'tertiary' &&
        'group-hover:hover-state-on-tertiary-container group-focus-visible:focus-state-on-tertiary-container'
    ),

    icon: classNames(
      {
        'h-6 w-6': size == 'small' || size == 'medium' || isExtended,
        'h-9 w-9': size == 'large' && !isExtended,
      },
      variant === 'surface' && 'text-primary',
      variant === 'primary' && 'text-on-primary-container',
      variant === 'secondary' && 'text-on-secondary-container',
      variant === 'tertiary' && 'text-on-tertiary-container'
    ),

    label: classNames(
      'text-label-large text-nowrap',
      variant === 'surface' && 'text-primary',
      variant === 'primary' && 'text-on-primary-container',
      variant === 'secondary' && 'text-on-secondary-container',
      variant === 'tertiary' && 'text-on-tertiary-container'
    ),
  }),
  default: 'fab',
});
