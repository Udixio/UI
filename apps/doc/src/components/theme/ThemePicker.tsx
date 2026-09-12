import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Color } from '@udixio/theme';
import {
  createBackgroundChromaPaletteOverride,
  createSurfaceLevelColors,
  DEFAULT_SURFACE_LEVEL,
  getBackgroundChromaPaletteOverride,
  getSurfaceLevelColors,
  isBackgroundChromaPaletteOverride,
  isDerivedPaletteOverride,
  resolveSourceColor,
  surfaceLevelShift,
  themeConfigStore,
  themeServiceStore,
} from '@/stores/themeConfigStore.ts';
import { ColorPicker } from './ColorPicker';
import {
  Button,
  Card,
  IconButton,
  Slider,
  Switch,
  Tooltip,
} from '@udixio/ui-react';
import { iInfo } from '@udixio/icons-rounded-400/info';
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

interface SettingHeaderProps {
  label: string;
  value: React.ReactNode;
  info: { title: string; text: string };
}

/** A slider's label, its value, and a tooltip explaining the setting. */
const SettingHeader = ({ label, value, info }: SettingHeaderProps) => (
  <div className="flex items-center justify-between gap-3 text-label-medium text-on-surface-variant">
    <span className="flex items-center gap-1">
      {label}
      <Tooltip
        variant="rich"
        content={
          <div className="grid gap-1">
            <span className="text-title-small">{info.title}</span>
            <p className="text-body-small text-on-surface-variant">
              {info.text}
            </p>
          </div>
        }
      >
        <IconButton
          icon={iInfo}
          variant="standard"
          size="xSmall"
          label={`About ${label.toLowerCase()}`}
        />
      </Tooltip>
    </span>
    <span className="shrink-0 tabular-nums">{value}</span>
  </div>
);

interface SettingsSectionProps {
  id: string;
  title: string;
  description: string;
  /** Always rendered, above the collapsible settings. */
  children?: React.ReactNode;
  /** Settings revealed by the title switch; without them, no switch. */
  settings?: React.ReactNode;
}

const SettingsSection = ({
  id,
  title,
  description,
  children,
  settings,
}: SettingsSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const labelId = `theme-builder-${id}-title`;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <span id={labelId} className="text-title-medium text-on-surface">
            {title}
          </span>
          <p className="mt-1 text-body-medium text-on-surface-variant">
            {description}
          </p>
        </div>
        {settings && (
          <Switch
            checked={expanded}
            onCheckedChange={setExpanded}
            aria-labelledby={labelId}
            aria-controls={`theme-builder-${id}-settings`}
          />
        )}
      </div>
      {children}
      {settings && expanded && (
        <div
          id={`theme-builder-${id}-settings`}
          className={`space-y-5${children ? ' mt-5' : ''}`}
        >
          {settings}
        </div>
      )}
    </div>
  );
};

export const ThemePicker: React.FC = () => {
  const $config = useStore(themeConfigStore);
  const $themeService = useStore(themeServiceStore);

  const [activePalette, setActivePalette] = useState<string | null>(null);
  const backgroundLevel =
    getSurfaceLevelColors($config.colors) ?? DEFAULT_SURFACE_LEVEL;
  const neutralOverride = $config.palettes?.neutral;
  const backgroundChromaLevel =
    getBackgroundChromaPaletteOverride(neutralOverride) ?? 0;

  const sourceHct = resolveSourceColor($config.sourceColor);

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

  // The slider goes up to the hue's peak chroma across all tones: the maximum
  // at the current tone is a display limit, not a configuration one.
  const sourcePeakChroma = React.useMemo(
    () => Color.peakChroma(sourceHct.hue),
    [sourceHct.hue],
  );

  /**
   * The tone closest to the current one at which the hue displays `chroma`;
   * failing that (chroma above the peak), the peak's tone.
   */
  const nearestToneFor = (chroma: number, fromTone: number): number => {
    if (Color.maxChroma(sourceHct.hue, fromTone) >= chroma) return fromTone;
    let peak = { tone: fromTone, chroma: 0 };
    for (let delta = 0.5; delta <= 100; delta += 0.5) {
      for (const tone of [fromTone + delta, fromTone - delta]) {
        if (tone < 0 || tone > 100) continue;
        const max = Color.maxChroma(sourceHct.hue, tone);
        if (max >= chroma) return tone;
        if (max > peak.chroma) peak = { tone, chroma: max };
      }
    }
    return peak.tone;
  };

  const updateSourceColor = (chroma: number, tone: number) => {
    const next = Color.from({ hue: sourceHct.hue, chroma, tone });
    if (
      next.hue === sourceHct.hue &&
      next.chroma === sourceHct.chroma &&
      next.tone === sourceHct.tone
    ) {
      return;
    }
    themeConfigStore.set({ ...themeConfigStore.get(), sourceColor: next });
  };

  const handleBackgroundLevelChange = (nextLevel: number) => {
    const config = themeConfigStore.get();
    const { colors: _colors, ...rest } = config;

    themeConfigStore.set(
      nextLevel === DEFAULT_SURFACE_LEVEL
        ? rest
        : { ...rest, colors: createSurfaceLevelColors(nextLevel) },
    );
  };

  const handleBackgroundChromaLevelChange = (nextLevel: number) => {
    const config = themeConfigStore.get();
    const palettes = { ...config.palettes };
    const level = Math.round(nextLevel * 10) / 10;

    if (level === 0) {
      if (!isBackgroundChromaPaletteOverride(palettes.neutral)) return;
      delete palettes.neutral;
    } else {
      palettes.neutral = createBackgroundChromaPaletteOverride(level);
    }
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

    const surfaceLevel = getSurfaceLevelColors(config.colors);
    if (surfaceLevel !== null) {
      const shift = surfaceLevelShift(surfaceLevel);
      const layerCode = (base: number) =>
        formatExportNumber(Math.max(0, base + shift));
      const outer = (dark: number, light: number) =>
        `surfaceContainerTone(api.context.isDark ? ${layerCode(dark)} : ${layerCode(light)}, api)`;
      const surfaceEntries = [
        `surface: (color) => color.withTone(surfaceContainerTone(${layerCode(0.5)}, api))`,
        `surfaceDim: (color) => color.withTone(${outer(0.5, 5)})`,
        `surfaceBright: (color) => color.withTone(${outer(5, 0.5)})`,
        `surfaceContainerLowest: (color) => color.withTone(surfaceContainerTone(${layerCode(0)}, api))`,
        `surfaceContainerLow: (color) => color.withTone(surfaceContainerTone(${layerCode(1)}, api))`,
        `surfaceContainer: (color) => color.withTone(surfaceContainerTone(${layerCode(2)}, api))`,
        `surfaceContainerHigh: (color) => color.withTone(surfaceContainerTone(${layerCode(3)}, api))`,
        `surfaceContainerHighest: (color) => color.withTone(surfaceContainerTone(${layerCode(4)}, api))`,
      ];
      entries.push(
        formatExportEntry(
          'colors',
          `(api) => ({\n${surfaceEntries.map((entry) => `  ${entry},`).join('\n')}\n})`,
        ),
      );
    }

    const palettes = config.palettes;
    if (palettes && typeof palettes === 'object' && !Array.isArray(palettes)) {
      const configuredPalettes = palettes as Record<string, unknown>;
      const paletteEntries = PALETTES.flatMap(({ key }) => {
        const value = configuredPalettes[key];
        let valueCode: string | null = null;

        const chromaLevel = getBackgroundChromaPaletteOverride(value);

        if (typeof value === 'string') {
          valueCode = JSON.stringify(value);
        } else if (value instanceof Color) {
          valueCode = JSON.stringify(value.hex);
        } else if (chromaLevel !== null) {
          valueCode = [
            '(_context, base) => ({',
            '  ...base,',
            `  chroma: base.chroma * ${formatExportNumber(1 + chromaLevel)},`,
            '})',
          ].join('\n');
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
          ? `${formatExportKey(key)}: ${valueCode.split('\n').join('\n  ')}`
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
      ...(surfaceLevel !== null
        ? ["import { surfaceContainerTone } from '@udixio/theme';"]
        : []),
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
    <>
      <div>
        <SettingsSection
          id="source"
          title="Source color"
          description="Generates the Primary palette"
        >
          <ColorPicker />
          <div className="mt-5 space-y-5">
            <div>
              <SettingHeader
                label="Chroma"
                value={<>{Math.round(sourceHct.chroma)}</>}
                info={{
                  title: 'Chroma',
                  text: 'Intensity of the source color, from gray (0) to the maximum its hue allows at this tone. It propagates to the Primary, Secondary and Tertiary palettes.',
                }}
              />
              <Slider
                name="theme-builder-source-chroma"
                value={sourceHct.chroma}
                min={0}
                max={Math.max(sourcePeakChroma, sourceHct.chroma)}
                step={0.5}
                aria-label="Source color chroma"
                valueFormatter={(value) => Math.round(value)}
                onChange={(value) =>
                  // A chroma the current tone cannot display moves the tone
                  // to the nearest one that can.
                  updateSourceColor(
                    value,
                    nearestToneFor(value, sourceHct.tone),
                  )
                }
              />
            </div>

            <div>
              <SettingHeader
                label="Tone"
                value={<>{Math.round(sourceHct.tone)}</>}
                info={{
                  title: 'Tone',
                  text: 'Lightness of the source color, from black (0) to white (100). It is the starting point for the derived tones.',
                }}
              />
              <Slider
                name="theme-builder-source-tone"
                value={sourceHct.tone}
                min={0}
                max={100}
                step={0.5}
                aria-label="Source color tone"
                valueFormatter={(value) => Math.round(value)}
                onChange={(value) =>
                  // A tone that no longer displays the current chroma clips it
                  // to its maximum: the configuration always stays displayable.
                  updateSourceColor(
                    Math.min(
                      sourceHct.chroma,
                      Color.maxChroma(sourceHct.hue, value),
                    ),
                    value,
                  )
                }
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          id="background"
          title="Background and accessibility"
          description="Depth and tint of backgrounds, color contrast"
          settings={
            <>
              <div>
                <SettingHeader
                  label="Background level"
                  value={<>{backgroundLevel}</>}
                  info={{
                    title: 'Background level',
                    text: 'Depth of the surfaces: 1 follows the variant, 0 brings the background toward white, each step above darkens every surface by one layer.',
                  }}
                />
                <Slider
                  name="theme-builder-background-level"
                  value={backgroundLevel}
                  min={0}
                  max={5}
                  marks={[0, 1, 2, 3, 4, 5].map((value) => ({
                    value,
                    label: String(value),
                  }))}
                  aria-label="Background level"
                  valueFormatter={(value) => value}
                  onChange={handleBackgroundLevelChange}
                />
              </div>

              <div>
                <SettingHeader
                  label="Background tint"
                  value={
                    <>
                      {backgroundChromaLevel > 0 ? '+' : ''}{' '}
                      {Math.round(backgroundChromaLevel * 10) / 10}
                    </>
                  }
                  info={{
                    title: 'Background tint',
                    text: 'Amount of color in the grays: 0 follows the variant, −1 gives neutral grays, +1 doubles the tint inherited from the source color.',
                  }}
                />
                <Slider
                  valueFormatter={(value) => {
                    return Math.round(value * 10) / 10;
                  }}
                  name="theme-builder-background-chroma-level"
                  value={backgroundChromaLevel}
                  min={-1}
                  step={0.1}
                  max={1}
                  aria-label="Background tint"
                  onChange={handleBackgroundChromaLevelChange}
                />
              </div>

              <div>
                <SettingHeader
                  label="Contrast"
                  value={
                    <>
                      {brightness > 0 ? '+' : ''}{' '}
                      {Math.round(brightness * 10) / 10}
                    </>
                  }
                  info={{
                    title: 'Contrast',
                    text: 'Lightness gap between text and backgrounds: 0 targets WCAG AA (4.5:1), +1 goes toward AAA (7:1), negative values relax the constraint.',
                  }}
                />
                <Slider
                  valueFormatter={(value) => {
                    return Math.round(value * 10) / 10;
                  }}
                  name="brightness"
                  value={brightness}
                  min={-1}
                  step={0.1}
                  max={1}
                  aria-label="Contrast"
                  onChange={(v) => setBrightness(v)}
                />
              </div>
            </>
          }
        />

        <SettingsSection
          id="palettes"
          title="Palettes"
          description="Steers the palettes derived from the source"
          settings={
            <>
              <div className="flex flex-col gap-2">
                {PALETTES.map(({ key, label }) => {
                  const hex = getPaletteHex(key);
                  const isOpen = activePalette === key;
                  const isOverridden =
                    $config.palettes?.[key] !== undefined &&
                    !isDerivedPaletteOverride($config.palettes?.[key]);
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
                        <span className="text-title-medium flex-1">
                          {label}
                        </span>
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
            </>
          }
        />
      </div>

      <div className="flex justify-end">
        <Button
          variant="outlined"
          label="Export theme.config.ts"
          onClick={handleExport}
        />
      </div>
    </>
  );
};

export default ThemePicker;
