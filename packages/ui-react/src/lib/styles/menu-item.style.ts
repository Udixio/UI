import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';
import { MenuItemInterface } from '../interfaces/menu-item.interface';

const menuItemConfig: ClassNameComponent<MenuItemInterface> = ({
  variant,
  disabled,
  isActive,
}) => ({
  menuItem: classNames(
    'group/menu-item text-start  overflow-hidden flex items-center h-12 px-3 cursor-pointer outline-none select-none shrink-0 ',
    'text-label-large',
    'transition-colors duration-200',
    'rounded-xl',

    {
      'text-on-surface': !variant || variant === 'standard',
      // 'hover:bg-on-surface/[0.08] focus:bg-on-surface/[0.12]': !props?.variant || props.variant === 'standard', // Handled by State
      // 'hover:bg-on-tertiary-container/[0.08] focus:bg-on-tertiary-container/[0.12]': props?.variant === 'vibrant', // Handled by State
      'opacity-38 pointer-events-none': disabled,
    },
    (variant === 'vibrant' || isActive) && [
      'bg-secondary-container text-on-secondary-container',
    ],
  ),
  itemLabel: classNames('flex-1 truncate'),
  itemIcon: classNames(
    'w-6 h-6 flex items-center justify-center menu-item-icon',
  ),
  leadingIcon: classNames('mr-3'),
  trailingIcon: classNames('ml-3'),
});

export const menuItemStyle = defaultClassNames<MenuItemInterface>(
  'menuItem',
  menuItemConfig,
);
export const useMenuItemStyle = createUseClassNames<MenuItemInterface>(
  'menuItem',
  menuItemConfig,
);
