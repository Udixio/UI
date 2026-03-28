import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { themeConfigStore } from '@/stores/themeConfigStore.ts';
import { ColorPicker } from './ColorPicker';
import { Divider, Slider, Switch } from '@udixio/ui-react';
import { iDarkMode } from '@udixio/icons-rounded-400/dark_mode';
import { iLightMode } from '@udixio/icons-rounded-400/light_mode';

export const ThemePicker: React.FC = () => {
  const $config = useStore(themeConfigStore);

  const [isDark, setIsDark] = React.useState($config.isDark);

  useEffect(() => {
    const next = { ...themeConfigStore.get(), isDark };
    themeConfigStore.set(next);

    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark', !!isDark);
    }
  }, [isDark]);

  const [brightness, setBrightness] = useState(0);

  useEffect(() => {
    themeConfigStore.set({
      ...themeConfigStore.get(),
      contrastLevel: brightness,
    });
  }, [brightness]);

  return (
    <div className="space-y-8 mt-4">
      <div className="flex flex-col gap-6">
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex flex-col">
            <span className="text-title-medium font-semibold text-on-surface">
              Mode Sombre
            </span>
            <span className="text-body-medium text-on-surface-variant">
              Appliquer le thème sombre
            </span>
          </div>
          <Switch
            activeIcon={iDarkMode}
            inactiveIcon={iLightMode}
            onChange={(value) => {
              if (typeof value === 'boolean') {
                setIsDark(value);
              }
            }}
            selected={isDark}
          />
        </label>

        <Divider />

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-title-medium font-semibold text-on-surface">
                Contraste
              </span>
              <span className="text-body-medium text-on-surface-variant">
                Ajuster le niveau de contraste
              </span>
            </div>
            <span className="text-label-large font-mono bg-surface text-on-surface px-3 py-1 rounded-lg shadow-sm border border-outline-variant">
              {brightness > 0 ? '+' : ''}
              {Math.round(brightness * 10) / 10}
            </span>
          </div>
          <div className="px-2 pt-2 pb-4">
            <Slider
              valueFormatter={(value) => {
                return Math.round(value * 10) / 10;
              }}
              name="brightness"
              value={brightness}
              min={-1}
              step={0.1}
              max={1}
              onChange={(v) => setBrightness(v)}
            />
          </div>
        </div>
      </div>

      <h3 className="text-title-medium font-bold mb-6 text-on-surface">
        Couleur source
      </h3>
      <ColorPicker />
    </div>
  );
};

export default ThemePicker;
