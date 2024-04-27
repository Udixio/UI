import { ClassNameComponent, StylesHelper } from '../../utils';
import { TabElement, TabState } from './Tab';

export const tabStyle: ClassNameComponent<TabState, TabElement> = ({
  label,
  icon,
  variant,
  selected,
  stateVariant,
}) => ({
  tab: StylesHelper.classNames([
    'bg-surface flex-1 group overflow-hidden flex px-4 justify-center items-center',
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
      'box-content px-5 py-1 rounded-full': stateVariant == 'fit',
    },
    {
      applyWhen: variant === 'primary',
      styles: [
        {
          'group-hover:hover-state-on-surface': !selected,
          'group-hover:hover-state-primary': selected,
        },
      ],
    },
    {
      applyWhen: variant === 'secondary',
      styles: ['group-hover:hover-state-on-surface'],
    },
  ]),
  content: StylesHelper.classNames([
    'flex  gap-0.5',
    {
      relative: stateVariant == 'fit' && !(icon && variant == 'primary'),
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
          'flex-row items-end gap-2': Boolean(label && icon),
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
});
