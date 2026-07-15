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
      'rounded-[12px]': size == 'small',
      'rounded-[16px]': size == 'medium',
      'rounded-[28px]': size == 'large',
    },
    {
      'p-2': size == 'small',
      'p-4': size == 'medium',
      'p-[30px]': size == 'large',
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
    'size-6': size == 'small' || size == 'medium',
    'size-9': size == 'large',
  }),
  label: classNames('text-nowrap', {
    'text-title-medium': size == 'small',
    'text-title-large': size == 'medium',
    'text-headline-small': size == 'large',
  }),
});

export const fabStyle = defaultClassNames<FabInterface>('fab', fabConfig);

export const useFabStyle = createUseClassNames<FabInterface>('fab', fabConfig);
