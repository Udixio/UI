import { type ClassNameComponent, cx, defaultClassNames } from '../utils';
import { TextFieldInterface } from '../interfaces';

const textFieldConfig: ClassNameComponent<TextFieldInterface> = ({
  disabled,
  variant,
  errorText,
  isFocused,
  isFloating,
  leadingIcon,
  suffix,
  multiline,
}) => {
  const showLegend = isFloating && variant === 'outlined';

  return {
    textField: cx({
      'opacity-[.38]': disabled,
    }),
    content: cx(
      'group/text-field transition-[background-color,border-color,border-width] duration-[var(--udx-motion-spring-fast-effects-duration,150ms)] ease-[var(--udx-motion-spring-fast-effects-easing,cubic-bezier(0.31,0.94,0.34,1))] motion-reduce:transition-none [html[data-motion-policy=reduce]_&]:transition-none relative flex items-center',
      { 'h-14': !multiline },
      {
        'border-on-surface-variant':
          !errorText?.length && !isFocused && variant == 'filled',
        'border-outline':
          !errorText?.length && !isFocused && variant == 'outlined',
        'border-primary': !errorText?.length && isFocused,
        'border-error': !!errorText?.length,
      },
      { 'bg-on-surface/[0.04]': disabled },
      variant == 'filled' && [
        'rounded-t overflow-hidden border-b',
        { 'bg-surface-container-highest': !disabled },
      ],

      variant == 'outlined' && [
        'border rounded box-border',
        {
          'border-[3px]': isFocused,
        },
      ],
    ),
    stateLayer: cx(
      'absolute -z-10 w-full h-full top-0 left-0',
      {
        hidden: variant == 'outlined',
      },
      {
        'group-state-on-surface': !disabled,
        'focus-state-on-surface': isFocused,
      },
    ),
    // The width is animated by `createTextFieldLabelController`. The padding
    // flips between two values, so it transitions on the same fast effects
    // spring: a border-box cannot be narrower than its padding, and a padding
    // that jumped would open the notch by 16 px before the width moved.
    legend: cx(
      'ml-2 overflow-hidden whitespace-nowrap text-body-small h-0 transition-[padding] duration-[var(--udx-motion-spring-fast-effects-duration,150ms)] ease-[var(--udx-motion-spring-fast-effects-easing,cubic-bezier(0.31,0.94,0.34,1))] motion-reduce:transition-none [html[data-motion-policy=reduce]_&]:transition-none',
      showLegend ? 'w-auto px-2' : 'w-0 px-0',
    ),
    label: cx(
      // The floating label moves, rescales and recolours on the fast effects spring, in step with the notch it opens.
      // Its position and its size are both transitioned, since the class changes both; `transform` carries the
      // `-translate-y-1/2` of its resting place.
      'absolute pointer-events-none whitespace-nowrap outline-none inline-flex transition-[top,left,right,transform,padding,font-size,line-height,letter-spacing,color] duration-[var(--udx-motion-spring-fast-effects-duration,150ms)] ease-[var(--udx-motion-spring-fast-effects-easing,cubic-bezier(0.31,0.94,0.34,1))] motion-reduce:transition-none [html[data-motion-policy=reduce]_&]:transition-none',
      { 'text-on-surface-variant': !disabled && !errorText?.length },
      { 'text-on-surface': disabled },
      { 'text-error': !!errorText?.length },
      { 'text-primary': !errorText?.length && isFocused },
      showLegend
        ? cx(
            '-top-3 px-1 text-body-small z-10',
            // The label is positioned from the input wrapper, which starts
            // after the leading icon. The legend notch is positioned from
            // the fieldset edge, so cancel the icon's 32px footprint
            // (ml-3 + the 20px icon) while the outlined label is floating.
            leadingIcon ? '-left-6' : 'left-2',
          )
        : variant === 'filled' && isFloating
          ? 'left-4 top-2 text-body-small'
          : 'left-4 top-1/2 -translate-y-1/2 text-body-large',
    ),
    input: cx(
      'w-full resize-none px-4 text-body-large bg-[inherit] outline-none autofill:transition-colors autofill:duration-[5000000ms]',
      {
        ' text-on-surface placeholder:text-on-surface-variant': !disabled,
        'placeholder:text-on-surface text-on-surface': disabled,
      },
      {
        'pr-0': !!suffix,
      },
      variant == 'filled' && ' pb-2 pt-6',
      variant == 'outlined' && 'py-4 relative z-10',
    ),
    activeIndicator: cx(
      'absolute w-0 inset-x-0 border-rounded mx-auto bottom-0',
      variant == 'filled' && [
        'h-[2px] transition-all duration-300',
        { 'bg-primary': !errorText?.length },
        { 'bg-error': !!errorText?.length },
        { '!w-full': isFocused },
      ],
    ),
    supportingText: cx(
      ' text-body-small px-4 pt-1',
      { 'text-on-surface-variant': !disabled && !errorText?.length },
      { 'text-on-surface': disabled },
      { '!w-full': isFocused },
      { 'text-error': !!errorText?.length },
    ),
    leadingIcon: cx('h-12 ml-3 flex items-center justify-center cursor-text'),
    trailingIcon: cx('h-12 w-12 flex items-center justify-center cursor-text'),
    suffix: cx(
      'text-on-surface-variant pl-0 pr-4',
      variant == 'filled' && ' pb-2 pt-6',
      variant == 'outlined' && 'py-4 relative z-10',
    ),
  };
};

export const textFieldStyle = defaultClassNames<TextFieldInterface>(
  'textField',
  textFieldConfig,
);
