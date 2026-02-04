
import { type ClassNameComponent, classNames, defaultClassNames, createUseClassNames } from '../utils';
import { MenuItemInterface } from '../interfaces/menu-item.interface';

const menuItemConfig: ClassNameComponent<MenuItemInterface> = ({ props }) => ({
  item: classNames(
    'relative flex items-center h-12 px-3 cursor-pointer outline-none select-none shrink-0',
    'text-label-large',
    'transition-colors duration-200',
    {
        'text-on-surface': !props?.variant || props.variant === 'standard',
        'hover:bg-on-surface/[0.08] focus:bg-on-surface/[0.12]': !props?.variant || props.variant === 'standard',
        'hover:bg-on-tertiary-container/[0.08] focus:bg-on-tertiary-container/[0.12]': props?.variant === 'vibrant',
        'opacity-38 pointer-events-none': props?.disabled,
    }
  ),
  selectedItem: classNames(
    'bg-secondary-container text-on-secondary-container',
    'hover:bg-secondary-container/[0.8]',
    '[&_.menu-item-icon]:text-inherit',
    {
         // For vibrant, selected state
        '!bg-on-tertiary-container/[0.12]': props?.variant === 'vibrant',
    }
  ),
  itemLabel: classNames('flex-1 truncate'),
  itemIcon: classNames('w-6 h-6 flex items-center justify-center menu-item-icon'),
  leadingIcon: classNames('mr-3'),
  trailingIcon: classNames('ml-3'),
});

export const menuItemStyle = defaultClassNames<MenuItemInterface>('menu-item', menuItemConfig);
export const useMenuItemStyle = createUseClassNames<MenuItemInterface>('menu-item', menuItemConfig);
