import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { themeConfigStore } from '@/stores/themeConfigStore.ts';
import { ColorPicker } from './ColorPicker';
import { Slider, Switch } from '@udixio/ui-react';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high transition-colors">
          <div className="flex flex-col">
            <span className="text-label-large font-medium text-on-surface">
              Mode Sombre
            </span>
            <span className="text-body-small text-on-surface-variant">
              Basculer entre clair et sombre
            </span>
          </div>
          <Switch
            activeIcon={faMoon}
            inactiveIcon={faSun}
            onChange={(value) => setIsDark(value)}
            selected={isDark}
          />
        </div>

        <div className="flex flex-col justify-center p-4 rounded-xl border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high transition-colors gap-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="contrast"
              className="text-label-large font-medium text-on-surface"
            >
              Contraste
            </label>
            <span className="text-label-small font-mono bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded">
              {brightness > 0 ? '+' : ''}
              {Math.round(brightness * 10) / 10}
            </span>
          </div>
          <div className="px-1">
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

      <div className="p-5 rounded-xl border border-outline-variant/40 bg-surface-container-low">
        <h3 className="text-title-medium font-bold mb-4 text-on-surface">
          Personnalisation de la couleur
        </h3>
        <ColorPicker />
      </div>
    </div>
  );
};

export default ThemePicker;
