import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';
import { TabInterface } from '../interfaces';

const tabConfig: ClassNameComponent<TabInterface> = ({
  isSelected,
  icon,
  label,
  variant,
  disabled,
}) => ({
  tab: cx(
    'flex-1 group/tab outline-none flex px-4 justify-center items-center',
    disabled ? 'cursor-default' : 'cursor-pointer',
    { 'z-10': isSelected },
    Boolean(icon && label) && variant === 'primary' && 'h-16',
    !(Boolean(icon && label) && variant === 'primary') && 'h-12',
  ),
  stateLayer: cx(
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
  content: cx(
    'flex  gap-0.5 h-full justify-center',
    {
      '': Boolean(label && !icon),
    },

    variant === 'primary' && 'flex-col items-center',
    variant === 'secondary' && {
      'flex-col items-center': Boolean(!(label && icon)),
      'flex-row items-center gap-2': Boolean(label && icon),
    },
  ),
  icon: cx(
    'h-6 w-6 p-0.5 !box-border',
    disabled && 'text-on-surface/[0.38]',
    !disabled &&
      variant === 'primary' && {
        'text-on-surface-variant': !isSelected,
        'text-primary': isSelected,
      },
    !disabled &&
      variant === 'secondary' && {
        'text-on-surface-variant': !isSelected,
        'text-on-surface': isSelected,
      },
  ),
  label: cx(
    'text-title-small  text-nowrap',
    disabled && 'text-on-surface/[0.38]',
    !disabled &&
      variant === 'primary' && {
        'text-on-surface-variant': !isSelected,
        'text-primary': isSelected,
      },
    !disabled &&
      variant === 'secondary' && {
        'text-on-surface-variant': !isSelected,
        'text-on-surface': isSelected,
      },
  ),
});

export const tabStyle = defaultClassNames<TabInterface>('tab', tabConfig);
