export type SliderMark = {
  value: number;
  label?: string;
};

export type SliderProps = {
  /** Controlled value. Providing it makes the slider controlled for its lifetime. */
  value?: number;
  /** Initial value for uncontrolled usage. */
  defaultValue?: number;
  /** Called once for each accepted value transition (drag, click, or keyboard). */
  onChange?: (value: number) => void;
  /** Prevents interaction and form submission. */
  disabled?: boolean;
  /** Name of the underlying hidden form control. */
  name?: string;
  /** Formats the value shown in the drag indicator and `aria-valuetext`. */
  valueFormatter?: (value: number) => string | number;
  /**
   * Snapping increment. Defaults to 10 when neither `step` nor `marks` is
   * given; explicit `marks` without `step` snaps to those marks instead.
   */
  step?: number;
  /** Minimum value. Use `-Infinity` for an open lower end. @default 0 */
  min?: number;
  /** Maximum value. Use `Infinity` for an open upper end. @default 100 */
  max?: number;
  /**
   * Labeled positions along the track. Snapped to when `step` is not given;
   * shown for reference alongside a numeric `step` otherwise.
   */
  marks?: SliderMark[];
};

export type SliderStates = {
  /** Whether the value is currently being changed by a drag gesture. */
  isChanging: boolean;
};

type Elements = [
  'slider',
  'activeTrack',
  'handle',
  'inactiveTrack',
  'valueIndicator',
  'dot',
];

export interface SliderInterface {
  type: 'div';
  props: SliderProps;
  states: SliderStates;
  elements: Elements;
}
