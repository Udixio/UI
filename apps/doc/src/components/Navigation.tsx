import { faHourglass, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Fab, NavigationRail, NavigationRailItem } from '@udixio/ui-react';
import rWidgets from '@material-design-icons/svg/outlined/widgets.svg?raw';
import sWidgets from '@material-design-icons/svg/filled/widgets.svg?raw';
import rPalette from '@material-design-icons/svg/outlined/palette.svg?raw';
import sAnimation from '@material-design-icons/svg/filled/animation.svg?raw';
import rAnimation from '@material-design-icons/svg/outlined/animation.svg?raw';
import sPalette from '@material-design-icons/svg/filled/palette.svg?raw';

export const Navigation = () => {
  return (
    <NavigationRail className={'bg-surface-container'}>
      <Fab variant={'tertiary'} icon={faSearch} href={'/search'}>
        Search
      </Fab>
      <NavigationRailItem icon={faHourglass} iconSelected={faHourglass}>
        Get started
      </NavigationRailItem>
      <NavigationRailItem
        href={'/animations'}
        icon={rAnimation}
        iconSelected={sAnimation}
      >
        animations
      </NavigationRailItem>
      <NavigationRailItem
        href={'/components'}
        icon={rWidgets}
        iconSelected={sWidgets}
      >
        Components
      </NavigationRailItem>
      <NavigationRailItem
        href={'/themes'}
        icon={rPalette}
        iconSelected={sPalette}
      >
        Themes
      </NavigationRailItem>
    </NavigationRail>
  );
};
