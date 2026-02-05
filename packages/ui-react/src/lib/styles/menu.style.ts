import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';
import { MenuInterface } from '../interfaces';

const menuConfig: ClassNameComponent<MenuInterface> = ({ props }) => ({
  menu: classNames(
    'z-50 min-w-[112px] max-w-[280px] max-h-[300px] overflow-y-auto',
    'rounded-2xl py-2 shadow-2', // Elevation 2
    'flex flex-col',
    {
      'bg-surface-container': !props?.variant || props.variant === 'standard',
      // Vibrant uses tertiary-container (approximated) or just colored surface
      'bg-tertiary-container text-on-tertiary-container':
        props?.variant === 'vibrant',
    },
  ),
});

export const menuStyle = defaultClassNames<MenuInterface>('menu', menuConfig);

export const useMenuStyle = createUseClassNames<MenuInterface>(
  'menu',
  menuConfig,
);
