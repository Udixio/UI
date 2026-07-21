import { Icon } from '../icon';

export type SideSheetVariant = 'standard' | 'modal';

export type SideSheetPosition = 'left' | 'right';

type Props = {
  variant?: SideSheetVariant;
  /** Headline displayed in the side sheet header. */
  title?: string;
  position?: SideSheetPosition;
  /** Controlled mode: explicitly control whether the side sheet is extended. */
  extended?: boolean;
  /** Callback when the extended state changes. */
  onExtendedChange?: (extended: boolean) => void;
  closeIcon?: Icon;
  /** Show the trailing divider. Defaults to `true` for the standard variant. */
  divider?: boolean;
};

export type SideSheetStates = {
  /** Computed extended state (controlled value or internal state). */
  isExtended: boolean;
};

type Elements = [
  'sideSheet',
  'container',
  'title',
  'content',
  'header',
  'closeButton',
  'divider',
  'overlay',
];

export interface SideSheetInterface {
  type: 'div';
  props: Props;
  states: SideSheetStates;
  elements: Elements;
}
