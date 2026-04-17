import React, { useEffect } from 'react';
import {
  Button,
  Card,
  Checkbox,
  IconButton,
  Switch,
} from '@udixio/ui-react';
import { iDesktopWindows } from '@udixio/icons-rounded-400/desktop_windows';
import { iLayers } from '@udixio/icons-rounded-400/layers';
import { iPalette } from '@udixio/icons-rounded-400/palette';
import { iSend } from '@udixio/icons-rounded-400/send';
import { iSearch } from '@udixio/icons-rounded-400/search';
import { iDarkMode } from '@udixio/icons-rounded-400/dark_mode';
import { iLightMode } from '@udixio/icons-rounded-400/light_mode';
import { useStore } from '@nanostores/react';
import { themeConfigStore } from '@/stores/themeConfigStore.ts';

export const ThemePreviewTabs = () => {
  const $config = useStore(themeConfigStore);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isActuallyDark = document.body.classList.contains('dark');
      if (isActuallyDark !== themeConfigStore.get().isDark) {
        themeConfigStore.set({ ...themeConfigStore.get(), isDark: isActuallyDark });
      }
    }
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Quick Edit Bar */}
      <Card variant="outlined" className="bg-surface-container-low w-full max-w-3xl mb-8 p-4 md:p-6 flex flex-row items-center justify-between z-20 shadow-lg rounded-[2rem] border-outline-variant/50">
         <div className="flex items-center gap-4 md:gap-6">
            <div className="relative w-12 h-12 rounded-full shadow-md border-2 border-outline-variant overflow-hidden shrink-0 transition-colors" style={{ backgroundColor: $config.sourceColor as string }}>
              <input
                title="Change Primary Color"
                type="color"
                value={$config.sourceColor as string}
                onChange={(e) => {
                    themeConfigStore.set({ ...themeConfigStore.get(), sourceColor: e.target.value });
                }}
                className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 opacity-0 cursor-pointer"
                aria-label="Change primary color"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-title-medium font-bold text-on-surface">Couleur de base</span>
              <span className="text-label-medium text-on-surface-variant hidden md:block">Génère automatiquement toute la palette</span>
            </div>
         </div>
         
         <div className="w-px h-10 bg-outline-variant/40 hidden sm:block"></div>
         
         <div className="flex items-center gap-4 md:gap-6">
            <div className="flex flex-col text-right sm:text-left">
              <span className="text-title-medium font-bold text-on-surface cursor-pointer select-none" onClick={() => {
                const newValue = !$config.isDark;
                themeConfigStore.set({ ...themeConfigStore.get(), isDark: newValue });
                if (typeof document !== 'undefined') {
                  document.body.classList.toggle('dark', newValue);
                }
              }}>Mode Sombre</span>
            </div>
            <Switch
              activeIcon={iDarkMode}
              inactiveIcon={iLightMode}
              onChange={(value) => {
                if (typeof value === 'boolean') {
                  themeConfigStore.set({ ...themeConfigStore.get(), isDark: value });
                  if (typeof document !== 'undefined') {
                    document.body.classList.toggle('dark', value);
                  }
                }
              }}
              selected={$config.isDark}
            />
         </div>
      </Card>

    </div>
  );
};
