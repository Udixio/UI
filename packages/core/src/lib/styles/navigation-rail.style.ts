import { type ClassNameComponent, cx, defaultClassNames } from '../utils';
import { NavigationRailInterface } from '../interfaces/navigation-rail.interface';

const navigationRailConfig: ClassNameComponent<NavigationRailInterface> = ({
  isExtended,
  alignment,
}) => ({
  // The width bounds are not classes: they are animated inline by the width controller (`createNavigationRailWidthController`),
  // so the rail's classes are the same in both states.
  navigationRail: cx('flex flex-col  left-0 h-full top-0 pt-11 w-fit', {
    'justify-between': alignment == 'middle',
    'justify-start': alignment == 'top',
  }),
  header: cx('flex flex-col gap-1 items-start'),
  menuIcon: 'mx-5',
  segments: cx(' flex flex-col  overflow-auto min-w-full mt-10', {
    'w-full': !isExtended,
    'w-fit  items-start': isExtended,
  }),
  footer: cx('mt-auto max-h-[160px] flex flex-col justify-end mx-5 mb-4', {
    'items-center': !isExtended,
    'items-start': isExtended,
  }),
});

export const navigationRailStyle = defaultClassNames<NavigationRailInterface>(
  'navigationRail',
  navigationRailConfig,
);
