import { Icon } from '../icon';

export type SwitchProps = {
  /** Controlled mode: explicitly control whether the switch is on. */
  checked?: boolean;
  /** Uncontrolled mode: initial checked state. */
  defaultChecked?: boolean;
  /** Icon shown inside the thumb while checked. */
  activeIcon?: Icon;
  /** Icon shown inside the thumb while unchecked. */
  inactiveIcon?: Icon;
  /** Prevents interaction. */
  disabled?: boolean;
};

export type SwitchStates = {
  /** Computed checked state (controlled value or internal state). */
  isChecked: boolean;
};

type Elements = ['switch', 'handleContainer', 'handle', 'stateLayer', 'icon'];

export interface SwitchInterface {
  type: 'div';
  props: SwitchProps;
  states: SwitchStates;
  elements: Elements;
}
