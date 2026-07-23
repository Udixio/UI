import { Fab, NavigationRail, NavigationRailItem } from '@udixio/ui-react';
import { iAnimation } from '@udixio/icons-rounded-400/animation';
import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
import { iPalette } from '@udixio/icons-rounded-400/palette';
import { iWidgets } from '@udixio/icons-rounded-400/widgets';
import { iSearch } from '@udixio/icons-rounded-400/search';
import { iAnimationFilled } from '@udixio/icons-rounded-400/filled/animation';
import { iHourglassFilled } from '@udixio/icons-rounded-400/filled/hourglass';
import { iPaletteFilled } from '@udixio/icons-rounded-400/filled/palette';
import { iWidgetsFilled } from '@udixio/icons-rounded-400/filled/widgets';

export const Navigation = () => {
  return (
    <NavigationRail className={'bg-surface-dim'}>
      <Fab
        variant={'tertiary'}
        icon={iSearch}
        href={'/search'}
        label="Search"
      />
      <NavigationRailItem
        href={'/theme/introduction'}
        icon={iHourglass}
        iconSelected={iHourglassFilled}
      >
        Get started
      </NavigationRailItem>
      <NavigationRailItem
        href={'/animations'}
        icon={iAnimation}
        iconSelected={iAnimationFilled}
      >
        animations
      </NavigationRailItem>
      <NavigationRailItem
        href={'/components'}
        icon={iWidgets}
        iconSelected={iWidgetsFilled}
      >
        Components
      </NavigationRailItem>
      <NavigationRailItem
        href={'/theme/builder'}
        icon={iPalette}
        iconSelected={iPaletteFilled}
      >
        Themes
      </NavigationRailItem>
    </NavigationRail>
  );
};
