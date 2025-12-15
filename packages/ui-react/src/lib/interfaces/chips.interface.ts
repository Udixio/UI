import { ActionOrLink } from '../utils';
import { Dispatch, ReactNode, SetStateAction } from 'react';

type ChipsVariant = 'outlined' | 'elevated';

type Props = {
  /**
   * The chip variant determines the style.
   */
  variant?: ChipsVariant;

  children?: ReactNode;

  selectedChip?: number | null;
  setSelectedChip?: Dispatch<SetStateAction<number | null>>;
  scrollable?: boolean;
};

type Elements = ['chips'];

export type ChipsInterface = ActionOrLink<Props> & {
  elements: Elements;
  states: {};
};
