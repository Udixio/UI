import { type ClassNameComponent, cx, defaultClassNames } from '../utils';
import { MenuItemInterface } from '../interfaces/menu-item.interface';

const menuItemConfig: ClassNameComponent<MenuItemInterface> = ({
  variant,
  disabled,
  isSelected,
}) => ({
  menuItem: cx(
    'group/menu-item relative text-start overflow-hidden flex items-center h-12 px-3 cursor-pointer outline-none select-none shrink-0',
    'text-label-large',
    'transition-colors duration-200',
    'rounded-xl',
    {
      'text-on-surface': !variant || variant === 'standard',
      'opacity-38 pointer-events-none': disabled,
    },
    isSelected &&
      !disabled && ['bg-secondary-container text-on-secondary-container'],
  ),
  stateLayer: cx(
    'absolute inset-0 pointer-events-none state-ripple-group-[menu-item]',
  ),
  itemLabel: cx('flex-1 truncate'),
  itemIcon: cx('w-6 h-6 flex items-center justify-center menu-item-icon'),
  leadingIcon: cx('mr-3'),
  trailingIcon: cx('ml-3'),
});

export const menuItemStyle = defaultClassNames<MenuItemInterface>(
  'menuItem',
  menuItemConfig,
);
