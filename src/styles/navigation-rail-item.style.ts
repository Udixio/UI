import { classNames, defaultClassNames } from '../utils';
import { NavigationRailItemInterface } from '../interfaces';

export const navigationRailItemStyle =
  defaultClassNames<NavigationRailItemInterface>(
    'navigationRailItem',
    ({ isSelected, icon, label, variant }) => ({
      navigationRailItem: classNames(
        ' group flex flex-col  pt-1 pb-1.5 h-[66px]',
        {
          'text-on-surface-variant': !isSelected,
          'text-on-secondary-container': isSelected,
          'gap-2': variant == 'vertical',
          'gap-0': variant == 'horizontal',
        }
      ),
      container: classNames(
        ' w-fit flex justify-center  relative rounded-full items-center ml-5',
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
        ]
      ),
      stateLayer: classNames(
        '  absolute w-full rounded-full h-full left-0 top-0  ',
        {
          'group-state-on-surface': !isSelected,
          'group-state-on-secondary-container': isSelected,
        }
      ),

      icon: classNames('size-6 flex'),
      label: classNames('w-fit mx-auto', {
        'text-label-large ': variant == 'horizontal',
        'text-label-medium': variant == 'vertical',
      }),
    })
  );
