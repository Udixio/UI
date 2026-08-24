import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Color } from '@udixio/theme';
import {
  isSecondaryHuePaletteOverride,
  markSecondaryHuePaletteOverride,
  themeConfigStore,
  themeServiceStore,
  themeServiceVersionStore,
} from '@/stores/themeConfigStore.ts';
import { ColorPicker } from './ColorPicker';
import { Button, Card, Divider, Slider } from '@udixio/ui-react';
import { AnimatePresence, motion } from 'motion/react';

const PALETTES = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'tertiary', label: 'Tertiary' },
  { key: 'error', label: 'Error' },
  { key: 'neutral', label: 'Neutral' },
] as const;

const formatExportKey = (key: string) =>
  /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);

const formatExportNumber = (value: number) =>
  String(Math.round(value * 10000) / 10000);

const formatExportEntry = (key: string, value: string) => {
  const lines = value.split('\n');
  return [
    `  ${formatExportKey(key)}: ${lines[0]}`,
    ...lines.slice(1).map((line) => `  ${line}`),
  ].join('\n');
};

export const ThemePicker: React.FC = () => {
  const $config = useStore(themeConfigStore);
  const $themeService = useStore(themeServiceStore);
  const themeServiceVersion = useStore(themeServiceVersionStore);

  const [activePalette, setActivePalette] = useState<string | null>(null);
  const [backgroundLevel, setBackgroundLevel] = useState(5);

  const sourceHct = Color.fromHex($config.sourceColor as string);
  const tertiaryOverride = $config.palettes?.tertiary;
  const isSecondaryHueOverridden =
    isSecondaryHuePaletteOverride(tertiaryOverride);
  const tertiarySourceHue = React.useMemo(() => {
    const tertiary = $config.palettes?.tertiary;

    if (typeof tertiary === 'string') {
      return Color.fromHex(tertiary).hue;
    }

    if ($themeService) {
      try {
        if (typeof tertiary === 'function') {
          return tertiary($themeService.context).hue;
        }

        return $themeService.context.variant.palettesFor($themeService.context)
          .tertiary.hue;
      } catch {
        // Fall back to the source hue while the theme API is initializing.
      }
    }

    return sourceHct.hue;
  }, [$config.palettes, $themeService, sourceHct.hue, themeServiceVersion]);
  const secondaryHueGradient = React.useMemo(() => {
    const colors = [];
    for (let hue = 0; hue <= 360; hue += 30) {
      const hueMaxChroma = Color.maxChroma(hue, sourceHct.tone);
      colors.push(
        Color.from({
          hue,
          chroma: Math.min(sourceHct.chroma, hueMaxChroma),
          tone: sourceHct.tone,
        }).hex,
      );
    }
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [sourceHct.chroma, sourceHct.tone]);

  const getPaletteHex = (key: string): string => {
    if (!$themeService) return '#888888';
    try {
      return $themeService.palettes.get(key as any).getColor(40).hex;
    } catch {
      return '#888888';
    }
  };

  const [brightness, setBrightness] = useState(0);

  useEffect(() => {
    themeConfigStore.set({
      ...themeConfigStore.get(),
      contrastLevel: brightness,
    });
  }, [brightness]);

  const handleSecondaryHueChange = (nextHue: number) => {
    const palettes = { ...themeConfigStore.get().palettes };
    palettes.tertiary = markSecondaryHuePaletteOverride(() => ({
      hue: nextHue,
      chroma: sourceHct.chroma,
    }));
    themeConfigStore.set({ ...themeConfigStore.get(), palettes });
  };

  const handleSecondaryHueReset = () => {
    const config = themeConfigStore.get();
    const palettes = { ...config.palettes };
    delete palettes.tertiary;
    themeConfigStore.set({ ...config, palettes });
  };

  const handleExport = () => {
    const config = themeConfigStore.get() as unknown as Record<string, unknown>;
    const entries: string[] = [];
    const sourceColor = config.sourceColor;
    let sourceColorCode: string | null = null;

    if (typeof sourceColor === 'string') {
      sourceColorCode = JSON.stringify(sourceColor);
    } else if (sourceColor instanceof Color) {
      sourceColorCode = JSON.stringify(sourceColor.hex);
    } else if (typeof sourceColor === 'function' && $themeService) {
      try {
        const resolvedSourceColor = sourceColor($themeService.context);
        sourceColorCode = JSON.stringify(
          resolvedSourceColor instanceof Color
            ? resolvedSourceColor.hex
            : resolvedSourceColor,
        );
      } catch {
        sourceColorCode = null;
      }
    }

    if (!sourceColorCode && $themeService) {
      sourceColorCode = JSON.stringify($themeService.context.sourceColor.hex);
    }

    if (!sourceColorCode) return;
    entries.push(formatExportEntry('sourceColor', sourceColorCode));

    if (typeof config.contrastLevel === 'number') {
      entries.push(
        formatExportEntry(
          'contrastLevel',
          formatExportNumber(config.contrastLevel),
        ),
      );
    }

    const palettes = config.palettes;
    if (palettes && typeof palettes === 'object' && !Array.isArray(palettes)) {
      const configuredPalettes = palettes as Record<string, unknown>;
      const paletteEntries = PALETTES.flatMap(({ key }) => {
        const value = configuredPalettes[key];
        let valueCode: string | null = null;

        if (typeof value === 'string') {
          valueCode = JSON.stringify(value);
        } else if (value instanceof Color) {
          valueCode = JSON.stringify(value.hex);
        } else if (typeof value === 'function' && $themeService) {
          try {
            const { hue, chroma } = value($themeService.context) as {
              hue: number;
              chroma: number;
            };
            if (Number.isFinite(hue) && Number.isFinite(chroma)) {
              valueCode = `() => ({ hue: ${formatExportNumber(
                hue,
              )}, chroma: ${formatExportNumber(chroma)} })`;
            }
          } catch {
            valueCode = null;
          }
        }

        return valueCode
          ? `${formatExportKey(key)}: ${valueCode}`
          : [];
      });

      if (paletteEntries.length > 0) {
        entries.push(
          formatExportEntry(
            'palettes',
            `{\n${paletteEntries.map((entry) => `  ${entry},`).join('\n')}\n}`,
          ),
        );
      }
    }

    const fileContent = [
      "import { defineConfig } from '@udixio/tailwind';",
      '',
      'export default defineConfig({',
      `${entries.join(',\n')},`,
      '});',
      '',
    ].join('\n');
    const blob = new Blob([fileContent], {
      type: 'text/typescript;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'theme.config.ts';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="space-y-8 mt-4">
      <div>
        <div className="space-y-4 rounded-2xl bg-surface-container-highest p-4">
          <div>
            <div className="mb-4">
              <span className="text-title-medium text-on-surface">
                Couleur source
              </span>
              <p className="mt-1 text-body-medium text-on-surface-variant">
                Génère la palette Primary
              </p>
            </div>
            <ColorPicker />
          </div>

          <Divider />

          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="theme-builder-secondary-source-hue"
                  className="text-label-medium text-on-surface-variant"
                >
                  Teinte secondaire
                </label>
                <span className="text-label-medium text-on-surface-variant">
                  {Math.round(tertiarySourceHue)}°
                </span>
              </div>
              <div className="relative h-7 overflow-hidden rounded-full ring-1 ring-inset ring-outline-variant">
                <input
                  id="theme-builder-secondary-source-hue"
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={tertiarySourceHue}
                  onChange={(event) =>
                    handleSecondaryHueChange(Number(event.target.value))
                  }
                  aria-label="Teinte secondaire"
                  className="slider h-full w-full cursor-pointer appearance-none"
                  style={{ background: secondaryHueGradient }}
                />
              </div>
              {isSecondaryHueOverridden && (
                <div className="mt-1 flex justify-end">
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleSecondaryHueReset}
                  >
                    Réinitialiser
                  </Button>
                </div>
              )}
            </div>

            <div>
              <div className=" flex items-center justify-between gap-3">
                <span className="text-label-medium text-on-surface-variant">
                  Niveau de fond
                </span>
                <span className="shrink-0 text-label-medium text-on-surface-variant">
                  {backgroundLevel}
                </span>
              </div>
              <Slider
                name="theme-builder-background-level"
                value={backgroundLevel}
                min={0}
                max={10}
                step={1}
                aria-label="Niveau de fond"
                valueFormatter={(value) => value}
                onChange={setBackgroundLevel}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-label-medium text-on-surface-variant">
                  Contraste
                </span>
                <span className="shrink-0 text-label-medium text-on-surface-variant">
                  {brightness > 0 ? '+' : ''}
                  {Math.round(brightness * 10) / 10}
                </span>
              </div>
              <Slider
                valueFormatter={(value) => {
                  return Math.round(value * 10) / 10;
                }}
                name="brightness"
                value={brightness}
                min={-1}
                step={0.1}
                max={1}
                aria-label="Contraste"
                onChange={(v) => setBrightness(v)}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-title-medium mb-4 text-on-surface">
          Couleurs de palette
        </h3>
        <div className="flex flex-col gap-2">
          {PALETTES.map(({ key, label }) => {
            const hex = getPaletteHex(key);
            const isOpen = activePalette === key;
            const isOverridden =
              $config.palettes?.[key] !== undefined &&
              !isSecondaryHuePaletteOverride($config.palettes?.[key]);
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
                        <ColorPicker paletteKey={key} showTone={false} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outlined"
          label="Exporter theme.config.ts"
          onClick={handleExport}
        />
      </div>
    </div>
  );
};

export default ThemePicker;
