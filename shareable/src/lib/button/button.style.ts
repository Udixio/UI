import { StyleHelper } from '../utils/style.helper';
import { IButton } from './button.interface';

export type ButtonVariant =
  | 'filled'
  | 'elevated'
  | 'outlined'
  | 'text'
  | 'filledTonal';

export class ButtonStyle {
  static button(args: Pick<IButton, 'buttonClass' | 'variant' | 'disabled'>) {
    return StyleHelper.classNames([
      args.buttonClass,
      'button group rounded-full inline-block',
      {
        applyWhen: args.variant === 'elevated',
        styles: [
          {
            'bg-surface-container-low': !args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'filled',
        styles: [
          {
            'bg-primary': !args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'filledTonal',
        styles: [
          {
            'bg-secondary-container': !args.disabled,
          },
        ],
      },
    ]);
  }

  static state(args: Pick<IButton, 'variant' | 'stateClass' | 'disabled'>) {
    return StyleHelper.classNames([
      args.stateClass,
      'state-layer flex gap-2 justify-center rounded-full  items-center px-6 py-2.5',
      {
        applyWhen: args.variant === 'elevated',
        styles: [
          {
            'group-disabled:bg-on-surface/[0.12]': args.disabled,
            'state-primary shadow-1  group-hover:shadow-2': !args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'filled',
        styles: [
          {
            'group-disabled:bg-on-surface/[0.12]': args.disabled,
            'state-on-primary group-hover:shadow-1': !args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'filledTonal',
        styles: [
          {
            'group-disabled:bg-on-surface/[0.12]': args.disabled,
            'state-on-secondary-container group-hover:shadow-1': !args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'outlined',
        styles: [
          ' border',
          {
            'group-disabled:border-on-surface/[0.12]': args.disabled,
            'state-primary border-outline state-primary group-focus:border-primary':
              !args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'text',
        styles: [
          {
            'state-primary': !args.disabled,
          },
        ],
      },
    ]);
  }

  static icon(args: Pick<IButton, 'variant' | 'iconClass' | 'disabled'>) {
    return StyleHelper.classNames([
      args.iconClass,
      'icon h-[18px] w-[18px]',
      {
        applyWhen: args.variant === 'elevated',
        styles: [
          {
            'text-primary': !args.disabled,
            'group-disabled:text-on-surface/[38%]': args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'filled',
        styles: [
          {
            'text-on-primary': !args.disabled,
            'group-disabled:text-on-surface/[38%]': args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'filledTonal',
        styles: [
          {
            'text-on-secondary-container': !args.disabled,
            'group-disabled:text-on-surface/[0.38]': args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'outlined',
        styles: [
          {
            'text-primary': !args.disabled,
            'group-disabled:text-on-surface/[0.38]': args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'text',
        styles: [
          {
            'text-primary': !args.disabled,
            'group-disabled:text-on-surface/[0.38]': args.disabled,
          },
        ],
      },
    ]);
  }

  static label(args: Pick<IButton, 'variant' | 'labelClass' | 'disabled'>) {
    return StyleHelper.classNames([
      args.labelClass,
      'label-text text-label-large',
      {
        applyWhen: args.variant === 'elevated',
        styles: [
          {
            'text-primary': !args.disabled,
            'group-disabled:text-on-surface/[38%]': args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'filled',
        styles: [
          {
            'text-on-primary': !args.disabled,
            'group-disabled:text-on-surface/[38%]': args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'filledTonal',
        styles: [
          {
            'text-on-secondary-container': !args.disabled,
            'group-disabled:text-on-surface/[0.38]': args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'outlined',
        styles: [
          {
            'text-primary': !args.disabled,
            'group-disabled:text-on-surface/[0.38]': args.disabled,
          },
        ],
      },
      {
        applyWhen: args.variant === 'text',
        styles: [
          {
            'text-primary': !args.disabled,
            'group-disabled:text-on-surface/[0.38]': args.disabled,
          },
        ],
      },
    ]);
  }
}
