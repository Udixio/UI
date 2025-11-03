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
  extended,
}) => ({
  fab: classNames(
    'flex shadow-3 hover:shadow-4 group/fab overflow-hidden outline-none items-center cursor-pointer',
    {
      'rounded-[12px]': size == 'small' && !extended,
      'rounded-[16px]': size == 'medium' || extended,
      'rounded-[28px]': size == 'large' && !extended,
    },
    {
      'p-2': size == 'small' && !extended,
      'p-4': size == 'medium' || extended,
      'p-[30px]': size == 'large' && !extended,
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
  ),
  icon: classNames({
    'size-6': size == 'small' || size == 'medium' || extended,
    'size-9': size == 'large' && !extended,
  }),
  label: classNames('text-title-medium text-nowrap'),
});

export const fabStyle = defaultClassNames<FabInterface>('fab', fabConfig);

export const useFabStyle = createUseClassNames<FabInterface>('fab', fabConfig);
