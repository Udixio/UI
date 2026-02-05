import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';
import { MenuInterface } from '../interfaces';

const menuConfig: ClassNameComponent<MenuInterface> = ({
  variant,
  hasGroups,
}) => ({
  menu: classNames(
    'z-50 min-w-[112px] max-w-[280px] max-h-[300px] overflow-y-auto',
    'rounded-2xl ', // Elevation 2
    'flex flex-col',
    {
      'bg-surface-container': !variant || variant === 'standard',
      // Vibrant uses tertiary-container (approximated) or just colored surface
      'bg-tertiary-container text-on-tertiary-container': variant === 'vibrant',
      'py-0.5 shadow-2 px-1': !hasGroups,
      'bg-transparent': hasGroups,
    },
  ),
});

export const menuStyle = defaultClassNames<MenuInterface>('menu', menuConfig);

export const useMenuStyle = createUseClassNames<MenuInterface>(
  'menu',
  menuConfig,
);
