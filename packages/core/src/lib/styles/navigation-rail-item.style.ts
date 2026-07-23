import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';
import { NavigationRailItemInterface } from '../interfaces';

const navigationRailItemConfig: ClassNameComponent<
  NavigationRailItemInterface
> = ({ isSelected, icon, label, variant }) => ({
  navigationRailItem: cx(
    ' group/navigation-rail-item flex flex-col  pt-1 pb-1.5 cursor-pointer',
    {
      'text-on-surface-variant': !isSelected,
      'text-on-secondary-container': isSelected,
      'gap-2  h-[68px]': variant == 'vertical',
      'gap-0  h-[66px]': variant == 'horizontal',
    },
  ),
  container: cx(
    ' w-fit flex justify-center  relative rounded-full items-center mx-5',
    {
      'bg-secondary-container overflow-hidden': isSelected,
      'gap-2 ': variant == 'horizontal',
      'gap-0 ': variant == 'vertical',
      'p-4': !label,
    },
    label && [
      'px-4',
      {
        'py-1 ': variant == 'vertical',
        'py-4 ': variant == 'horizontal',
      },
    ],
  ),
  stateLayer: cx('rounded-full'),

  icon: cx('size-6 flex'),
  label: cx('w-fit mx-auto text-nowrap', {
    'text-label-large ': variant == 'horizontal',
    'text-label-medium': variant == 'vertical',
  }),
});

export const navigationRailItemStyle =
  defaultClassNames<NavigationRailItemInterface>(
    'navigationRailItem',
    navigationRailItemConfig,
  );
