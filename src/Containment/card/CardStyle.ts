import { ClassNameComponent, StylesHelper } from '../../utils';
import { CardElement, CardState } from './Card';

export const cardStyle: ClassNameComponent<CardState, CardElement> = ({
  isInteractive,
  variant,
}) => ({
  card: StylesHelper.classNames([
    'card group rounded-xl overflow-hidden z-10',
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
    {
      applyWhen: variant !== 'filled',
      styles: 'border border-outline-variant',
    },
  ]),
  stateLayer: StylesHelper.classNames([
    'state-layer w-full top-0 left-0 h-full absolute -z-10',
    {
      ' group-hover:hover-state-on-surface group-focus-visible:focus-state-on-surface':
        isInteractive,
    },
  ]),
});
