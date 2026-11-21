import { type ClassNameComponent, cx, defaultClassNames } from '../utils';
import { CheckboxInterface } from '../interfaces/checkbox.interface';

/**
 * The box and the check mark follow the native input's `:checked` state through `group-has-[input:checked]` variants of the
 * root, so a checkbox drawn by the server shows its state with no script, and a click on the input shows at once. The root,
 * not a sibling selector, carries the variant: an adapter may wrap the check mark in its own element. Indeterminate is not
 * in markup (it is a DOM property), so the prop draws it: the box is filled, and the mark is always shown.
 */
const checkboxConfig: ClassNameComponent<CheckboxInterface> = ({
  indeterminate,
  disabled,
  invalid,
}) => ({
  checkbox: cx(
    'group/checkbox relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center overflow-visible',
    "has-[:focus-visible]:after:pointer-events-none has-[:focus-visible]:after:absolute has-[:focus-visible]:after:left-1/2 has-[:focus-visible]:after:top-1/2 has-[:focus-visible]:after:size-10 has-[:focus-visible]:after:-translate-x-1/2 has-[:focus-visible]:after:-translate-y-1/2 has-[:focus-visible]:after:rounded-full has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-2 has-[:focus-visible]:after:outline-offset-2 has-[:focus-visible]:after:outline-primary has-[:focus-visible]:after:content-['']",
    {
      'pointer-events-none opacity-[0.38]': disabled,
    },
  ),
  input: cx(
    'absolute left-1/2 top-1/2 z-10 size-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer opacity-0',
  ),
  box: cx(
    'pointer-events-none absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border-2 transition-colors duration-200',
    // Unchecked state (Border only)
    !indeterminate && {
      'border-on-surface-variant': !invalid && !disabled,
      'border-error': invalid && !disabled,
      'border-on-surface': disabled,
    },
    // Checked state (Filled by the input's :checked, read from the root)
    {
      'group-has-[input:checked]/checkbox:border-primary group-has-[input:checked]/checkbox:bg-primary': !invalid && !disabled,
      'group-has-[input:checked]/checkbox:border-error group-has-[input:checked]/checkbox:bg-error': invalid && !disabled,
      'group-has-[input:checked]/checkbox:border-on-surface group-has-[input:checked]/checkbox:bg-on-surface': disabled,
    },
    // Indeterminate state (Filled by the prop)
    indeterminate && {
      'bg-primary border-primary': !invalid && !disabled,
      'bg-error border-error': invalid && !disabled,
      'bg-on-surface border-on-surface': disabled,
    },
  ),
  icon: cx(
    'pointer-events-none absolute left-1/2 top-1/2 z-20 size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-on-primary',
    // Shown while the input is checked; always shown while indeterminate.
    indeterminate ? 'flex' : 'hidden group-has-[input:checked]/checkbox:flex',
    {
      'text-on-error': invalid && !disabled,
      'text-surface': disabled, // Usually on-surface with opacity against on-surface bg? No, checked disabled is on-surface bg with surface icon usually.
    },
  ),
  stateLayer:
    'state-ripple-group-[checkbox] absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full',
});

export const checkboxStyle = defaultClassNames<CheckboxInterface>(
  'checkbox',
  checkboxConfig,
);
