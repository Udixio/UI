import { ActionOrLink } from '../utils';
import { ReactNode } from 'react';

type ChipsVariant = 'input';

type Props = {
  /**
   * The chip variant determines the style.
   */
  variant?: ChipsVariant;

  children?: ReactNode;

  scrollable?: boolean;
};

type Elements = ['chips'];

export type ChipsInterface = ActionOrLink<Props> & {
  elements: Elements;
  states: {};
};
