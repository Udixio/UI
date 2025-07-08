import { IconButtonInterface } from '../interfaces/icon-button.interface';
import { classNames, defaultClassNames } from '../utils';

export const iconButtonStyle = defaultClassNames<IconButtonInterface>(
  'button',
  ({ variant, disabled, onToggle, isActive }) => {
    return {
      button: classNames(
        'rounded-full overflow-hidden transition-all duration-300',
        variant === 'filled' && [
          !disabled && {
            'bg-surface-container': !isActive && Boolean(onToggle),
            'bg-primary': isActive || !onToggle,
          },
          Boolean(disabled) && 'bg-on-surface/[0.12]',
        ],
        variant === 'tonal' && [
          !disabled && {
            'bg-surface-container': !isActive && Boolean(onToggle),
            'bg-secondary-container': isActive || !onToggle,
          },
          Boolean(disabled) && 'bg-on-surface/[0.12]',
        ],
        variant === 'outlined' && [
          !disabled && {
            'border border-outline': !isActive,
            'border border-transparent bg-inverse-surface': isActive,
          },
          Boolean(disabled) && {
            'border border-on-surface/[0.12]': !isActive,
            'border border-transparent bg-on-surface/[0.12]': isActive,
          },
          ,
        ]
      ),
      stateLayer: classNames(
        'p-2 flex rounded-full',
        !disabled && [
          variant === 'standard' && {
            'state-on-surface-variant': !isActive,
            'state-primary': isActive,
          },
          variant === 'filled' && {
            'state-primary': !isActive && Boolean(onToggle),
            'state-inverse-on-surface': isActive || !onToggle,
          },
          variant === 'tonal' && {
            'state-on-surface-variant': !isActive && Boolean(onToggle),
            'state-on-secondary-container': isActive || !onToggle,
          },
          variant === 'outlined' && {
            'state-on-surface-variant': !isActive,
            'state-on-primary': isActive,
          },
        ]
      ),
      icon: classNames(
        'h-5 p-0.5 w-5 transition-all duration-300',
        !disabled && [
          variant === 'standard' && {
            'text-on-surface-variant': !isActive,
            'text-primary': isActive,
          },
          variant === 'filled' && {
            'text-primary': !isActive && Boolean(onToggle),
            'text-on-primary': isActive || !onToggle,
          },
          variant === 'tonal' && {
            'text-on-surface-variant': !isActive && Boolean(onToggle),
            'text-on-secondary-container': isActive || !onToggle,
          },
          variant === 'outlined' && {
            'text-on-surface-variant': !isActive,
            'text-inverse-on-surface': isActive,
          },
        ],
        Boolean(disabled) && 'text-on-surface/[0.38]'
      ),
    };
  }
);
