import { ClassNameComponent, StylesHelper } from '../../utils';
import { TabElement, TabState } from './Tab';

export const tabStyle: ClassNameComponent<TabState, TabElement> = ({
  label,
  icon,
  variant,
  selected,
}) => ({
  tab: StylesHelper.classNames([
    'bg-surface flex-1 group overflow-hidden',
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
    'flex px-4 justify-center h-full',
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
    'h-full flex  gap-0.5 justify-end',
    {
      'pb-3.5': Boolean(label && !icon),
    },
    {
      applyWhen: variant === 'primary',
      styles: [
        'flex-col items-center',
        {
          'pb-2': Boolean(label && icon),
          'pb-3': Boolean(!label && icon),
        },
      ],
    },
    {
      applyWhen: variant === 'secondary',
      styles: [
        {
          'flex-col items-center': Boolean(!(label && icon)),
          'flex-row pb-3 items-end gap-2': Boolean(label && icon),
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
