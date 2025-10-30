import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';
import { NavigationRailInterface } from '../interfaces/navigation-rail.interface';

const navigationRailConfig: ClassNameComponent<NavigationRailInterface> = ({
  isExtended,
  alignment,
}) => ({
  navigationRail: classNames('flex flex-col  left-0 h-full top-0 pt-11', {
    'w-fit max-w-24': !isExtended,
    'w-fit min-w-[220px] max-w-[360px]': isExtended,
    'justify-between': alignment == 'middle',
    'justify-start': alignment == 'top',
  }),
  header: classNames('flex flex-col gap-1 items-start'),
  menuIcon: 'mx-5',
  segments: classNames(' flex flex-col  overflow-auto min-w-full mt-10', {
    'w-full': !isExtended,
    'w-fit  items-start': isExtended,
  }),
});

export const navigationRailStyle = defaultClassNames<NavigationRailInterface>(
  'navigationRail',
  navigationRailConfig,
);

export const useNavigationRailStyle =
  createUseClassNames<NavigationRailInterface>(
    'navigationRail',
    navigationRailConfig,
  );
