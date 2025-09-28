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

  const [brightness, setBrightness] = useState();

  useEffect(() => {
    themeConfigStore.set({
      ...themeConfigStore.get(),
      contrastLevel: brightness,
    });
  }, [brightness]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-outline-variant/40 bg-surface-container">
        <div className="flex items-center gap-3">
          <span className="text-sm text-on-surface-variant">Mode</span>
          <div className="inline-flex rounded-md overflow-hidden border border-outline-variant/40">
            <Switch
              activeIcon={faMoon}
              inactiveIcon={faSun}
              onChange={(value) => setIsDark(value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="contrast" className="text-sm text-on-surface-variant">
            Contrast
          </label>
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

      <ColorPicker />
    </div>
  );
};

export default ThemePicker;
