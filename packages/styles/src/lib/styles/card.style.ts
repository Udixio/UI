import { CardInterface } from '../interfaces';
import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';

const cardConfig: ClassNameComponent<CardInterface> = ({
  variant,
  interactive,
}) => ({
  card: classNames(
    ' rounded-xl overflow-hidden ',
    variant === 'outlined' && 'bg-surface border border-outline-variant',
    variant === 'elevated' && 'bg-surface-container-low shadow-1',
    variant === 'filled' && 'bg-surface-container-highest',
    {
      'group/card cursor-pointer': interactive,
    },
  ),
});

export const cardStyle = defaultClassNames<CardInterface>('card', cardConfig);

export const useCardStyle = createUseClassNames<CardInterface>(
  'card',
  cardConfig,
);
