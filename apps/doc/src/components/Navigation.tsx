import { useStore } from '@nanostores/react';
import {
  Fab,
  IconButton,
  NavigationRail,
  NavigationRailItem,
} from '@udixio/ui-react';
import { iAnimation } from '@udixio/icons-rounded-400/animation';
import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
import { iPalette } from '@udixio/icons-rounded-400/palette';
import { iWidgets } from '@udixio/icons-rounded-400/widgets';
import { iDarkMode } from '@udixio/icons-rounded-400/dark_mode';
import { iLightMode } from '@udixio/icons-rounded-400/light_mode';
import { iAnimationFilled } from '@udixio/icons-rounded-400/filled/animation';
import { iHourglassFilled } from '@udixio/icons-rounded-400/filled/hourglass';
import { iPaletteFilled } from '@udixio/icons-rounded-400/filled/palette';
import { iWidgetsFilled } from '@udixio/icons-rounded-400/filled/widgets';
import { iSearch } from '@udixio/icons-rounded-400/search';
import { themeConfigStore } from '@/stores/themeConfigStore.ts';
import { useEffect, useState } from 'react';
import { DocumentationSearch } from './DocumentationSearch';

export const Navigation = () => {
  const config = useStore(themeConfigStore);
  const isDark = config.isDark ?? false;
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const isActuallyDark = document.body.classList.contains('dark');
    if (isActuallyDark !== isDark) {
      themeConfigStore.set({
        ...themeConfigStore.get(),
        isDark: isActuallyDark,
      });
    }
  }, []);

  const toggleDarkMode = (value: boolean) => {
    themeConfigStore.set({ ...themeConfigStore.get(), isDark: value });
    document.body.classList.toggle('dark', value);
  };

  return (
    <>
      <NavigationRail
        className="bg-surface-dim"
        footer={
          <IconButton
            variant="outlined"
            icon={iLightMode}
            pressedIcon={iDarkMode}
            label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            toggleable
            pressed={!isDark}
            onPressedChange={(isLight) => toggleDarkMode(!isLight)}
          />
        }
      >
        <Fab
          variant="tertiary"
          icon={iSearch}
          label="Search"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen(true)}
        />
        <NavigationRailItem
          href={'/get-started/introduction'}
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
      <DocumentationSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};
