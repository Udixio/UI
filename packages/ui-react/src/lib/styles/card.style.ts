import { CardInterface } from '../interfaces';
import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';

const cardConfig: ClassNameComponent<CardInterface> = ({
  variant,
  isInteractive,
}) => ({
  card: classNames(
    'group/card rounded-xl overflow-hidden z-10',
    variant === 'outlined' && 'bg-surface border border-outline-variant',
    variant === 'elevated' && 'bg-surface-container-low shadow-1',
    variant === 'filled' && 'bg-surface-container-highest',
  ),
});

export const cardStyle = defaultClassNames<CardInterface>('card', cardConfig);

export const useCardStyle = createUseClassNames<CardInterface>(
  'card',
  cardConfig,
);
