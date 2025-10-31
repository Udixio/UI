import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';
import { FabInterface } from '../interfaces/fab.interface';

const fabConfig: ClassNameComponent<FabInterface> = ({
  size,
  variant,
  isExtended,
}) => ({
  fab: classNames(
    'flex shadow-3 hover:shadow-4 group/fab overflow-hidden outline-none items-center cursor-pointer',
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
    variant === 'tertiary' && 'bg-tertiary-container',
    variant === 'surface' && 'text-primary',
    variant === 'primary' && 'text-on-primary-container',
    variant === 'secondary' && 'text-on-secondary-container',
    variant === 'tertiary' && 'text-on-tertiary-container',
  ),
  icon: classNames({
    'size-6': size == 'small' || size == 'medium' || isExtended,
    'size-9': size == 'large' && !isExtended,
  }),

  label: classNames('text-title-medium text-nowrap'),
});

export const fabStyle = defaultClassNames<FabInterface>('fab', fabConfig);

export const useFabStyle = createUseClassNames<FabInterface>('fab', fabConfig);
