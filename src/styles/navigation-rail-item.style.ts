import { classNames, defaultClassNames } from '../utils';
import { NavigationRailItemInterface } from '../interfaces';

export const navigationRailItemStyle =
  defaultClassNames<NavigationRailItemInterface>(
    'navigationRailItem',
    ({ isSelected, icon, label, variant }) => ({
      navigationRailItem: classNames(' flex flex-col gap-2 group ', {
        'text-on-surface-variant': !isSelected,
        'text-on-secondary-container': isSelected,
      }),
      container: classNames(
        'overflow-hidden flex justify-center relative  rounded-full items-center gap-2 ',
        {
          'bg-secondary-container': isSelected,
          'p-4': !label,
        },
        label && [
          'px-4',
          {
            'py-1': variant == 'vertical',
            'py-4': variant == 'horizontal',
          },
        ]
      ),
      stateLayer: classNames('  absolute w-full h-full left-0 top-0  ', {
        'group-state-on-surface': !isSelected,
        'group-state-on-secondary-container': isSelected,
      }),

      icon: classNames('size-6 flex'),
      label: classNames({
        'text-label-large': variant == 'horizontal',
        'text-label-medium': variant == 'vertical',
      }),
    })
  );
