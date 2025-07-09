import { classNames, defaultClassNames } from '../utils';
import { NavigationRailInterface } from '../interfaces/navigation-rail.interface';

export const navigationRailStyle = defaultClassNames<NavigationRailInterface>(
  'navigationRail',
  ({ isExtended, alignment }) => ({
    navigationRail: classNames(
      'fixed left-0 h-full top-0 flex flex-col  items-center ',
      {
        'w-24': !isExtended,
        'w-fit min-w-[220px] max-w-[360px]': isExtended,
        'justify-between': alignment == 'middle',
        'justify-start gap-10': alignment == 'top',
      }
    ),
  })
);
