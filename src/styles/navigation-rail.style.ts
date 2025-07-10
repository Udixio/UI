import { classNames, defaultClassNames } from '../utils';
import { NavigationRailInterface } from '../interfaces/navigation-rail.interface';

export const navigationRailStyle = defaultClassNames<NavigationRailInterface>(
  'navigationRail',
  ({ isExtended, alignment }) => ({
    navigationRail: classNames('flex flex-col fixed left-0 h-full top-0 ', {
      'w-24': !isExtended,
      'w-fit min-w-[220px] max-w-[360px]': isExtended,
      'justify-between': alignment == 'middle',
      'justify-start gap-10': alignment == 'top',
    }),
    header: classNames('flex flex-col gap-1 items-start'),
    menuIcon: 'ml-5',
    segments: classNames(' flex flex-col ', {
      'w-full': !isExtended,
      'w-fit ml-5 items-start': isExtended,
    }),
  })
);
