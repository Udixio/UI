export type CheckboxProps = {
  /** Controlled mode: explicitly control whether the checkbox is checked. */
  checked?: boolean;
  /** Uncontrolled mode: initial checked state. */
  defaultChecked?: boolean;
  /** Marks the checkbox as partially selected without changing its checked value. */
  indeterminate?: boolean;
  /** Prevents interaction and form changes. */
  disabled?: boolean;
  /** Exposes the native invalid state and uses the error color role. */
  invalid?: boolean;
  /** Name of the underlying form control. */
  name?: string;
  /** Id of the underlying form control. Auto-generated if not provided. */
  id?: string;
  /** Value submitted with the form when checked. */
  value?: string;
  /** Requires the checkbox to be selected before its form can submit. */
  required?: boolean;
};

export type CheckboxStates = {
  /** Computed checked state (controlled value or internal state). */
  isChecked: boolean;
  /** Whether the underlying form control currently has focus. */
  isFocused: boolean;
};

type Elements = ['checkbox', 'input', 'box', 'icon', 'stateLayer'];

export interface CheckboxInterface {
  type: 'input';
  props: CheckboxProps;
  states: CheckboxStates;
  elements: Elements;
}
