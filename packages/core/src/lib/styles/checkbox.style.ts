import {
  type ClassNameComponent,
  classNames,
  defaultClassNames,
} from '../utils';
import { CheckboxInterface } from '../interfaces/checkbox.interface';

const checkboxConfig: ClassNameComponent<CheckboxInterface> = ({
  isChecked,
  indeterminate,
  disabled,
  error,
}) => ({
  checkbox: classNames(
    'inline-flex items-center justify-center relative size-4.5 ',
    {
      'pointer-events-none opacity-[0.38]': disabled,
    },
  ),
  input: classNames(
    'absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer',
  ),
  container: classNames(
    'relative flex items-center justify-center w-[18px] h-[18px] ',
  ),
  box: classNames(
    'absolute left-1/2 top-1/2 -translate-1/2 to rounded-[2px] size-4 border-2 transition-colors duration-200',
    // Unchecked state (Border only)
    !isChecked &&
      !indeterminate && {
        'border-on-surface-variant': !error && !disabled,
        'border-error': error && !disabled,
        'border-on-surface': disabled,
      },
    // Checked or Indeterminate state (Filled)
    (isChecked || indeterminate) && {
      'bg-primary border-primary': !error && !disabled,
      'bg-error border-error': error && !disabled,
      'bg-on-surface border-on-surface': disabled,
    },
  ),
  icon: classNames(
    'z-10 relative text-on-primary w-full h-full flex items-center justify-center pointer-events-none',
    {
      'text-on-error': error && !disabled,
      'text-surface': disabled, // Usually on-surface with opacity against on-surface bg? No, checked disabled is on-surface bg with surface icon usually.
    },
  ),
  stateLayer:
    'size-10 state-ripple-group-[checkbox] rounded-full cursor-pointer pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
});

export const checkboxStyle = defaultClassNames<CheckboxInterface>(
  'checkbox',
  checkboxConfig,
);
