import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';
import { CheckboxInterface } from '../interfaces/checkbox.interface';

const checkboxConfig: ClassNameComponent<CheckboxInterface> = ({
  isChecked,
  isIndeterminate,
  isDisabled,
  isError,
  isFocused,
  isHovered,
}) => ({
  checkbox: classNames('inline-flex items-center justify-center relative w-12 h-12 cursor-pointer', {
    'cursor-not-allowed opacity-[0.38]': isDisabled,
  }),
  input: classNames('absolute inset-0 w-full h-full opacity-0 z-10 cursor-inherit'),
  container: classNames('relative flex items-center justify-center w-[18px] h-[18px]'),
  box: classNames(
    'absolute inset-0 rounded-[2px] border-2 transition-colors duration-200',
    // Unchecked state (Border only)
    !isChecked && !isIndeterminate && {
      'border-on-surface-variant': !isError && !isDisabled,
      'border-error': isError && !isDisabled,
      'border-on-surface': isDisabled,
    },
    // Checked or Indeterminate state (Filled)
    (isChecked || isIndeterminate) && {
      'bg-primary border-primary': !isError && !isDisabled,
      'bg-error border-error': isError && !isDisabled,
      'bg-on-surface border-on-surface': isDisabled,
    }
  ),
  icon: classNames(
    'z-10 text-on-primary w-full h-full flex items-center justify-center',
    {
      'text-on-error': isError && !isDisabled,
      'text-surface': isDisabled, // Usually on-surface with opacity against on-surface bg? No, checked disabled is on-surface bg with surface icon usually.
    }
  ),
  stateLayer: classNames(
    'absolute inset-0 rounded-full transition-colors duration-200 pointer-events-none',
    {
      'bg-primary/10': isFocused && !isError, // Focus ring simulation
      'bg-error/10': isFocused && isError,
      'bg-on-surface/10': isFocused && isDisabled,
    }
    // Hover effects usually handled by parent group-hover or JS state if tracked
  ),
});

export const checkboxStyle = defaultClassNames<CheckboxInterface>(
  'checkbox',
  checkboxConfig,
);

export const useCheckboxStyle = createUseClassNames<CheckboxInterface>(
  'checkbox',
  checkboxConfig,
);
