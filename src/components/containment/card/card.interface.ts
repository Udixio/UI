import { ComponentProps } from '@utils/index';

export type CardBaseProps = {
  variant?: 'outlined' | 'elevated' | 'filled';
  isInteractive?: boolean;
};
export type CardStates = {};
export type CardElements = 'card' | 'stateLayer';
export type CardElementType = 'div';

export type CardProps = CardBaseProps &
  ComponentProps<CardBaseProps, CardStates, CardElements, CardElementType>;
