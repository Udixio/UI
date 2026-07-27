import { type ClassNameComponent, cx, defaultClassNames } from '../utils';
import { CheckboxInterface } from '../interfaces/checkbox.interface';

const checkboxConfig: ClassNameComponent<CheckboxInterface> = ({
  isChecked,
  indeterminate,
  disabled,
  invalid,
}) => ({
  checkbox: cx(
    'group/checkbox relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
    {
      'pointer-events-none opacity-[0.38]': disabled,
    },
  ),
  input: cx('absolute inset-0 z-10 size-full cursor-pointer opacity-0'),
  box: cx(
    'pointer-events-none absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border-2 transition-colors duration-200',
    // Unchecked state (Border only)
    !isChecked &&
      !indeterminate && {
        'border-on-surface-variant': !invalid && !disabled,
        'border-error': invalid && !disabled,
        'border-on-surface': disabled,
      },
    // Checked or Indeterminate state (Filled)
    (isChecked || indeterminate) && {
      'bg-primary border-primary': !invalid && !disabled,
      'bg-error border-error': invalid && !disabled,
      'bg-on-surface border-on-surface': disabled,
    },
  ),
  icon: cx(
    'pointer-events-none absolute left-1/2 top-1/2 z-20 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-on-primary',
    {
      'text-on-error': invalid && !disabled,
      'text-surface': disabled, // Usually on-surface with opacity against on-surface bg? No, checked disabled is on-surface bg with surface icon usually.
    },
  ),
  stateLayer: 'state-ripple-group-[checkbox] rounded-full',
});

export const checkboxStyle = defaultClassNames<CheckboxInterface>(
  'checkbox',
  checkboxConfig,
);
