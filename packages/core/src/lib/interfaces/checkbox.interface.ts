type Props = {
  /** Controlled mode: explicitly control whether the checkbox is checked. */
  checked?: boolean;
  /** Uncontrolled mode: initial checked state. */
  defaultChecked?: boolean;
  /** Visually marks the checkbox as partially selected. */
  indeterminate?: boolean;
  disabled?: boolean;
  /** Renders the checkbox with the error color role. */
  error?: boolean;
  /** Name of the underlying form control. */
  name?: string;
  /** Id of the underlying form control. Auto-generated if not provided. */
  id?: string;
  /** Value submitted with the form when checked. */
  value?: string;
};

export type CheckboxStates = {
  /** Computed checked state (controlled value or internal state). */
  isChecked: boolean;
  /** Whether the underlying form control currently has focus. */
  isFocused: boolean;
};

type Elements = [
  'checkbox',
  'input',
  'container',
  'box',
  'icon',
  'stateLayer',
  'ripple',
];

export interface CheckboxInterface {
  type: 'div';
  props: Props;
  states: CheckboxStates;
  elements: Elements;
}
