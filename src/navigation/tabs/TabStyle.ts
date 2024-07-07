import { ClassNameComponent, StylesHelper } from '../../utils';
import { TabElement, TabState } from './Tab';

export const tabStyle: ClassNameComponent<TabState, TabElement> = ({
  label,
  icon,
  variant,
  selected = false,
}) => ({
  tab: StylesHelper.classNames([
    'bg-surface flex-1 group outline-none flex px-4 justify-center items-center',
    { 'z-10': selected },
    {
      applyWhen: Boolean(icon && label) && variant === 'primary',
      styles: ['h-16'],
    },
    {
      applyWhen: !(Boolean(icon && label) && variant === 'primary'),
      styles: ['h-12'],
    },
  ]),
  stateLayer: StylesHelper.classNames([
    'absolute w-full h-full overflow-hidden left-1/2 top-1/2 transform -translate-y-1/2 -translate-x-1/2',
    {
      applyWhen: variant === 'primary',
      styles: [
        {
          'group-hover:hover-state-on-surface group-focus-visible:focus-state-on-surface':
            !selected,
          'group-hover:hover-state-primary group-focus-visible:focus-state-primary':
            selected,
        },
      ],
    },
    {
      applyWhen: variant === 'secondary',
      styles: [
        'group-hover:hover-state-on-surface group-focus-visible:focus-state-on-surface',
      ],
    },
  ]),
  content: StylesHelper.classNames([
    'flex  gap-0.5 h-full justify-center',
    {
      relative: variant == 'primary',
    },
    {
      '': Boolean(label && !icon),
    },
    {
      applyWhen: variant === 'primary',
      styles: ['flex-col items-center'],
    },
    {
      applyWhen: variant === 'secondary',
      styles: [
        {
          'flex-col items-center': Boolean(!(label && icon)),
          'flex-row items-center gap-2': Boolean(label && icon),
        },
      ],
    },
  ]),
  icon: StylesHelper.classNames([
    'h-6 w-6 p-0.5 !box-border',
    {
      applyWhen: variant === 'primary',
      styles: [
        {
          'text-on-surface-variant': !selected,
          'text-primary': selected,
        },
      ],
    },
    {
      applyWhen: variant === 'secondary',
      styles: [
        {
          'text-on-surface-variant': !selected,
          'text-on-surface': selected,
        },
      ],
    },
  ]),
  label: StylesHelper.classNames([
    'text-title-small  text-nowrap',
    {
      applyWhen: variant === 'primary',
      styles: [
        {
          'text-on-surface-variant': !selected,
          'text-primary': selected,
        },
      ],
    },
    {
      applyWhen: variant === 'secondary',
      styles: [
        {
          'text-on-surface-variant': !selected,
          'text-on-surface': selected,
        },
      ],
    },
  ]),
  underline: StylesHelper.classNames([
    'underline bg-primary  absolute w-full left-0 bottom-0',
    {
      applyWhen: variant === 'primary',
      styles: ['h-[3px] rounded-t'],
    },
    {
      applyWhen: variant === 'secondary',
      styles: ['h-0.5'],
    },
  ]),
});
