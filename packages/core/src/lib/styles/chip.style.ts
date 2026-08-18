import type { ClassNameComponent } from '../utils';
import { cx, defaultClassNames } from '../utils';
import { ChipInterface } from '../interfaces';

const chipConfig: ClassNameComponent<ChipInterface> = ({
  variant,
  disabled,
  trailingIcon,
  icon,
  isSelected,
  isInteractive,
  isFocused,
  isDragging,
  isEditing,
}) => ({
  chip: cx(
    ' group/chip px-3 py-1.5  rounded-lg flex items-center gap-2 outline-none',
    {
      'pl-2': icon,
      'pr-2': trailingIcon,
      'cursor-pointer': !disabled && isInteractive,
    },
    {
      ' text-on-surface-variant': (!isSelected && !isFocused) || isEditing,
      'bg-secondary-container text-on-secondary-container':
        (isSelected || isFocused) && !isEditing,
    },
    // Dragging feedback
    isDragging && ['opacity-100 cursor-grabbing shadow-3'],
    variant === 'outlined' && [
      'border border-outline-variant',
      {
        'border-transparent': isEditing,
      },
    ],
    variant === 'elevated' &&
      !isEditing && [
        'shadow-1 bg-surface-container-low',
        'border border-outline-variant',
      ],
  ),

  stateLayer: cx('rounded-lg overflow-hidden', {}),
  label: cx('text-label-large outline-none text-nowrap', {
    'opacity-[0.38]': disabled,
  }),
  leadingIcon: cx('text-primary size-[18px]', {
    'opacity-[0.38]': disabled,
  }),
  trailingIcon: cx('cursor-pointer size-[18px]', {
    'opacity-[0.38]': disabled,
  }),
});

export const chipStyle = defaultClassNames<ChipInterface>('chip', chipConfig);
