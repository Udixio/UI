import { CardInterface } from '../interfaces';
import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';

const cardConfig: ClassNameComponent<CardInterface> = ({
  variant,
  interactive,
}) => ({
  card: cx(
    'rounded-xl overflow-hidden',
    variant === 'outlined' && 'bg-surface border border-outline-variant',
    variant === 'elevated' && 'bg-surface-container-low shadow-1',
    variant === 'filled' && 'bg-surface-container-highest',
    {
      'group/card cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current':
        interactive,
    },
  ),
});

export const cardStyle = defaultClassNames<CardInterface>('card', cardConfig);
