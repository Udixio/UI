import { ClassNameComponent, StylesHelper } from '../../utils';
import { CardElement, CardState } from './Card';

export const cardStyle: ClassNameComponent<CardState, CardElement> = ({
  isInteractive,
  variant,
}) => ({
  card: StylesHelper.classNames([
    'card border border-outline-variant rounded-xl overflow-hidden z-10',
    {
      applyWhen: variant === 'outlined',
      styles: 'bg-surface',
    },
    {
      applyWhen: variant === 'elevated',
      styles: 'bg-surface-container-low shadow-1',
    },
    {
      applyWhen: variant === 'filled',
      styles: 'bg-surface-container-highest',
    },
  ]),
  stateLayer: StylesHelper.classNames([
    'state-layer w-full h-full absolute -z-10',
    { 'state-on-surface': isInteractive },
  ]),
});
