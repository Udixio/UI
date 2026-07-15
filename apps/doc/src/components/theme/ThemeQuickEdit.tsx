import React, { useEffect } from 'react';
import { Card, Switch } from '@udixio/ui-react';
import { iDarkMode } from '@udixio/icons-rounded-400/dark_mode';
import { iLightMode } from '@udixio/icons-rounded-400/light_mode';
import { useStore } from '@nanostores/react';
import { themeConfigStore } from '@/stores/themeConfigStore.ts';

export const ThemeQuickEdit = () => {
  const $config = useStore(themeConfigStore);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isActuallyDark = document.body.classList.contains('dark');
      if (isActuallyDark !== themeConfigStore.get().isDark) {
        themeConfigStore.set({ ...themeConfigStore.get(), isDark: isActuallyDark });
      }
    }
  }, []);

  const toggleDark = (value: boolean) => {
    themeConfigStore.set({ ...themeConfigStore.get(), isDark: value });
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark', value);
    }
  };

  return (
    <Card
      variant="outlined"
      className="bg-surface-container-low w-full max-w-3xl p-4 md:p-6 flex flex-row items-center justify-between shadow-lg rounded-[2rem] border-outline-variant"
    >
      <div className="flex items-center gap-4 md:gap-6">
        <div
          className="relative w-12 h-12 rounded-full shadow-md border-2 border-outline-variant overflow-hidden shrink-0 transition-colors"
          style={{ backgroundColor: $config.sourceColor as string }}
        >
          <input
            title="Change Primary Color"
            type="color"
            value={$config.sourceColor as string}
            onChange={(e) =>
              themeConfigStore.set({ ...themeConfigStore.get(), sourceColor: e.target.value })
            }
            className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 opacity-0 cursor-pointer"
            aria-label="Change primary color"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-title-medium font-bold text-on-surface">Couleur de base</span>
          <span className="text-label-medium text-on-surface-variant hidden md:block">
            Génère automatiquement toute la palette
          </span>
        </div>
      </div>

      <div className="w-px h-10 bg-outline-variant hidden sm:block" />

      <div className="flex items-center gap-4 md:gap-6">
        <span
          className="text-title-medium font-bold text-on-surface cursor-pointer select-none"
          onClick={() => toggleDark(!$config.isDark)}
        >
          Mode Sombre
        </span>
        <Switch
          activeIcon={iDarkMode}
          inactiveIcon={iLightMode}
          onChange={(value) => {
            if (typeof value === 'boolean') toggleDark(value);
          }}
          selected={$config.isDark}
        />
      </div>
    </Card>
  );
};
