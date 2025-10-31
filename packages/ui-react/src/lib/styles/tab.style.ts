import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';
import { TabInterface } from '../interfaces';

const tabConfig: ClassNameComponent<TabInterface> = ({
  isSelected,
  icon,
  label,
  variant,
}) => ({
  tab: classNames(
    'flex-1 group/tab outline-none flex px-4 justify-center items-center cursor-pointer',
    { 'z-10': isSelected },
    Boolean(icon && label) && variant === 'primary' && 'h-16',
    !(Boolean(icon && label) && variant === 'primary') && 'h-12',
  ),
  stateLayer: classNames(
    'absolute w-full h-full overflow-hidden left-1/2 top-1/2 transform -translate-y-1/2 -translate-x-1/2',
    variant === 'primary' && {
      'group-hover/tab:hover-state-on-surface group-focus-visible/tab:focus-state-on-surface':
        !isSelected,
      'group-hover/tab:hover-state-primary group-focus-visible/tab:focus-state-primary':
        isSelected,
    },
    variant === 'secondary' &&
      'group-hover/tab:hover-state-on-surface group-focus-visible/tab:focus-state-on-surface',
  ),
  content: classNames(
    'flex  gap-0.5 h-full justify-center',
    {
      relative: variant == 'primary',
    },
    {
      '': Boolean(label && !icon),
    },

    variant === 'primary' && 'flex-col items-center',
    variant === 'secondary' && {
      'flex-col items-center': Boolean(!(label && icon)),
      'flex-row items-center gap-2': Boolean(label && icon),
    },
  ),
  icon: classNames(
    'h-6 w-6 p-0.5 !box-border',
    variant === 'primary' && {
      'text-on-surface-variant': !isSelected,
      'text-primary': isSelected,
    },
    variant === 'secondary' && {
      'text-on-surface-variant': !isSelected,
      'text-on-surface': isSelected,
    },
  ),
  label: classNames(
    'text-title-small  text-nowrap',
    variant === 'primary' && {
      'text-on-surface-variant': !isSelected,
      'text-primary': isSelected,
    },
    variant === 'secondary' && {
      'text-on-surface-variant': !isSelected,
      'text-on-surface': isSelected,
    },
  ),
  underline: classNames(
    'bg-primary  absolute w-full left-0 bottom-0',
    variant === 'primary' && 'h-[3px] rounded-t',
    variant === 'secondary' && 'h-0.5',
  ),
});

export const tabStyle = defaultClassNames<TabInterface>('tab', tabConfig);

export const useTabStyle = createUseClassNames<TabInterface>('tab', tabConfig);
