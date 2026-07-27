export interface CheckboxChangeState {
  disabled: boolean;
  isChecked: boolean;
}

export type CheckboxChangeTransition =
  | { blocked: true; nextChecked?: never }
  | { blocked: false; nextChecked: boolean };

/** Resolves one checkbox activation without depending on a framework or DOM event. */
export function getCheckboxChangeTransition({
  disabled,
  isChecked,
}: CheckboxChangeState): CheckboxChangeTransition {
  if (disabled) return { blocked: true };
  return { blocked: false, nextChecked: !isChecked };
}
