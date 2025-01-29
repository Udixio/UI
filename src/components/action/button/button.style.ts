import { classNames, defaultClassNames } from '@utils/styles';
import {
  ButtonBaseProps,
  ButtonElements,
  ButtonStates,
} from './button.interface';

export const buttonStyle = defaultClassNames<
  ButtonBaseProps & ButtonStates,
  ButtonElements
>({
  defaultClassName: ({ variant, disabled, iconPosition, icon, loading }) => {
    return {
      button: classNames(
        'button group relative outline-none py-2.5 overflow-hidden rounded-full inline-block flex gap-2 justify-center rounded-full  items-center  ',
        variant === 'elevated' && {
          'bg-surface-container-low  shadow-1 hover:shadow-2': !disabled,
        },
        variant === 'filled' && {
          'bg-primary hover:shadow-1': !disabled,
        },
        variant === 'filledTonal' && {
          'bg-secondary-container hover:shadow-1': !disabled,
        },
        variant === 'outlined' && [
          ' border',
          {
            'border-on-surface/[0.12]': disabled,
            ' border-outline focus:border-primary': !disabled,
          },
        ],
        variant === 'text' && [
          '-my-2.5',
          { 'px-3': !icon },
          { 'pl-3 -ml-3 pr-4 -mr-4': icon && iconPosition == 'left' },
          { 'pl-4 -ml-4 pr-3 -mr-3': icon && iconPosition == 'right' },
          {
            'text-primary': !disabled,
            'text-on-surface/[0.38]': disabled,
          },
        ],
        variant !== 'text' && [
          { 'px-6': !icon },
          { 'pl-4 pr-6': icon && iconPosition == 'left' },
          { 'pl-6 pr-3': icon && iconPosition == 'right' },
        ]
      ),
      stateLayer: classNames(
        'state-layer min-h-full min-w-full absolute top-0 left-0 ',
        variant !== 'elevated' && {
          'bg-on-surface/[0.12]': disabled,
          'group-state-primary': !disabled,
        },
        variant !== 'filled' && {
          'bg-on-surface/[0.12]': disabled,
          'group-state-on-primary': !disabled,
        },
        variant !== 'filledTonal' && {
          'bg-on-surface/[0.12]': disabled,
          'group-state-on-secondary-container ': !disabled,
        },
        variant !== 'outlined' && {
          'group-state-primary  group-state-primary': !disabled,
        },
        variant !== 'text' && {
          'group-state-primary': !disabled,
        }
      ),
      label: classNames(
        'label-text text-label-large',
        { invisible: loading },
        variant !== 'elevated' && {
          'text-primary': !disabled,
          'text-on-surface/[38%]': disabled,
        },
        variant !== 'filled' && {
          'text-on-primary': !disabled,
          'text-on-surface/[38%]': disabled,
        },
        variant !== 'filledTonal' && {
          'text-on-secondary-container': !disabled,
          'text-on-surface/[0.38]': disabled,
        },
        variant !== 'outlined' && {
          'text-primary': !disabled,
          'text-on-surface/[0.38]': disabled,
        },
        variant !== 'text' && {
          'text-primary': !disabled,
          'text-on-surface/[0.38]': disabled,
        }
      ),
      icon: classNames(
        { invisible: loading },
        'icon h-[18px] w-[18px]',
        variant !== 'elevated' && {
          'text-primary': !disabled,
          'text-on-surface/[38%]': disabled,
        },
        variant !== 'filled' && {
          'text-on-primary': !disabled,
          'text-on-surface/[38%]': disabled,
        },
        variant !== 'filledTonal' && {
          'text-on-secondary-container': !disabled,
          'text-on-surface/[0.38]': disabled,
        },
        variant !== 'outlined' && {
          'text-primary': !disabled,
          'text-on-surface/[0.38]': disabled,
        },
        variant !== 'text' && {
          'text-primary': !disabled,
          'text-on-surface/[0.38]': disabled,
        }
      ),
    };
  },
  default: 'button',
});
