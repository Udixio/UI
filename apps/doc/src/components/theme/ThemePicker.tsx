import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  themeConfigStore,
  themeServiceStore,
} from '@/stores/themeConfigStore.ts';
import { ColorPicker } from './ColorPicker';
import { Card, Divider, Slider, Switch } from '@udixio/ui-react';
import { iDarkMode } from '@udixio/icons-rounded-400/dark_mode';
import { iLightMode } from '@udixio/icons-rounded-400/light_mode';
import { hexFromArgb } from '@material/material-color-utilities';
import { AnimatePresence, motion } from 'motion/react';

const PALETTES = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'tertiary', label: 'Tertiary' },
  { key: 'error', label: 'Error' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'neutralVariant', label: 'Neutral Variant' },
] as const;

export const ThemePicker: React.FC = () => {
  const $config = useStore(themeConfigStore);
  const $themeService = useStore(themeServiceStore);

  const [activePalette, setActivePalette] = useState<string | null>(null);

  const getPaletteHex = (key: string): string => {
    if (!$themeService) return '#888888';
    try {
      return hexFromArgb($themeService.palettes.get(key as any).tone(40));
    } catch {
      return '#888888';
    }
  };

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

      <div>
        <h3 className="text-title-medium font-bold mb-4 text-on-surface">
          Couleurs de palette
        </h3>
        <div className="flex flex-col gap-2">
          {PALETTES.map(({ key, label }) => {
            const hex = getPaletteHex(key);
            const isOpen = activePalette === key;
            const isOverridden = !!$config.palettes?.[key];
            return (
              <div
                key={key}
                className="overflow-hidden rounded-2xl bg-surface-container-highest"
              >
                <Card
                  interactive
                  variant="filled"
                  onClick={() => setActivePalette(isOpen ? null : key)}
                  className="flex items-center gap-3 p-2 rounded-2xl"
                >
                  <div
                    className="size-10 rounded-full shadow-sm shrink-0 relative"
                    style={{ background: `var(--color-${key})` }}
                  >
                    {isOverridden && (
                      <div className="size-2.5 rounded-full bg-primary border-2 border-surface absolute -top-0.5 -right-0.5" />
                    )}
                  </div>
                  <span className="text-title-medium flex-1">{label}</span>
                  <motion.svg
                    className="mr-2 text-on-surface-variant shrink-0"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </motion.svg>
                </Card>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="px-4 pt-6">
                        <ColorPicker paletteKey={key} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemePicker;
