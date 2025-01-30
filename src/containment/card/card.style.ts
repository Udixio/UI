import { classNames, defaultClassNames } from '../../utils';
import { CardBaseProps, CardElements, CardStates } from './card.interface';

export const cardStyle = defaultClassNames<
  CardBaseProps & CardStates,
  CardElements
>({
  defaultClassName: ({ variant, isInteractive }) => ({
    card: classNames(
      'card group/card rounded-xl overflow-hidden z-10',
      variant === 'outlined' && 'bg-surface',
      variant === 'elevated' && 'bg-surface-container-low shadow-1',
      variant === 'filled' && 'bg-surface-container-highest',
      variant !== 'filled' && 'border border-outline-variant'
    ),
    stateLayer: classNames([
      'state-layer w-full top-0 left-0 h-full absolute -z-10',
      {
        ' group-hover/card:hover-state-on-surface group-focus-visible/card:focus-state-on-surface':
          isInteractive,
      },
    ]),
  }),
  default: 'card',
});
