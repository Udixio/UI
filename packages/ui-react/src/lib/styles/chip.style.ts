import type { ClassNameComponent } from '../utils';
import { classNames, createUseClassNames, defaultClassNames } from '../utils';
import { ChipInterface } from '../interfaces';

const chipConfig: ClassNameComponent<ChipInterface> = ({
  variant,

  disabled,
  trailingIcon,
  icon,
  isActive,
  isInteractive,
  activated,
  isSelected,
  isDragging,
  onToggle,
}) => ({
  chip: classNames(
    ' group/chip px-3 py-1.5  rounded-lg flex items-center gap-2 outline-none',
    {
      'pl-2': icon,
      'pr-2': trailingIcon,
      'cursor-pointer': !disabled && isInteractive,
    },
    {
      ' text-on-surface-variant': !activated && !isSelected,

      'bg-secondary-container text-on-secondary-container':
        activated || isSelected,
    },
    // Dragging feedback
    isDragging && ['opacity-100 cursor-grabbing shadow-3'],
    variant === 'outlined' && ['border border-outline-variant'],
    variant === 'elevated' && ['shadow-1 bg-surface-container-low'],
  ),

  stateLayer: classNames('rounded-lg overflow-hidden', {}),
  label: classNames('', {
    'opacity-[0.38]': disabled,
  }),
  leadingIcon: classNames('text-primary size-[18px]', {
    'opacity-[0.38]': disabled,
  }),
  trailingIcon: classNames('cursor-pointer size-[18px]', {
    'opacity-[0.38]': disabled,
  }),
});

export const chipStyle = defaultClassNames<ChipInterface>('chip', chipConfig);

export const useChipStyle = createUseClassNames<ChipInterface>(
  'chip',
  chipConfig,
);
