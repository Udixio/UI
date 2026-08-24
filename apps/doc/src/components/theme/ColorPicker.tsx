import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  isSecondaryHuePaletteOverride,
  themeConfigStore,
  themeServiceStore,
  themeServiceVersionStore,
} from '@/stores/themeConfigStore.ts';
import { useStore } from '@nanostores/react';
import { Button, TextField } from '@udixio/ui-react';
import { Color } from '@udixio/theme';

interface ColorPickerProps {
  paletteKey?: string;
  showTone?: boolean;
}

const COLOR_FIELD_SIZE = 128;
const COLOR_FIELD_DRAG_SIZE = 48;
const MAX_CHROMA_LOOKUP_STEPS = 96;
const MAX_CHROMA_REFINE_STEPS = 8;
const CONTRAST_CURVE_STEPS = 64;
const CONTRAST_TONE_ITERATIONS = 12;
const CONTRAST_RATIOS = [3, 4.5, 7] as const;
const THEME_UPDATE_INTERVAL = 250;

const CONTRAST_CURVE_STYLES: Record<
  (typeof CONTRAST_RATIOS)[number],
  { color: string; opacity: number; width: number }
> = {
  3: { color: '#ffffff', opacity: 0.62, width: 1.1 },
  4.5: { color: '#ffffff', opacity: 1, width: 1.6 },
  7: { color: '#ffffff', opacity: 0.62, width: 1.1 },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

interface MaxChromaPoint {
  tone: number;
  chroma: number;
}

interface MaxChromaLookup {
  maxPoint: MaxChromaPoint;
  at: (tone: number) => number;
}

interface StoreColorState {
  hex: string;
  hue: number;
  chroma: number;
  tone: number;
}

const sameCoordinate = (left: number, right: number) =>
  Math.abs(left - right) < 0.05;

interface FieldPoint {
  x: number;
  y: number;
}

const createSmoothPath = (points: FieldPoint[]) => {
  if (!points.length) return '';

  const smoothedPoints = points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return point;

    const start = Math.max(0, index - 2);
    const end = Math.min(points.length - 1, index + 2);
    const count = end - start + 1;
    const totals = points.slice(start, end + 1).reduce(
      (accumulator, current) => ({
        x: accumulator.x + current.x,
        y: accumulator.y + current.y,
      }),
      { x: 0, y: 0 },
    );

    return {
      x: totals.x / count,
      y: totals.y / count,
    };
  });
  const pathPoints = smoothedPoints.filter(
    (_, index) => index % 4 === 0 || index === smoothedPoints.length - 1,
  );
  const formatPathNumber = (value: number) =>
    String(Math.round(value * 1000) / 1000);
  const commands = [
    `M ${formatPathNumber(pathPoints[0].x)} ${formatPathNumber(
      pathPoints[0].y,
    )}`,
  ];

  for (let index = 0; index < pathPoints.length - 1; index += 1) {
    const current = pathPoints[index];
    const next = pathPoints[index + 1];
    const previous = pathPoints[index - 1] ?? current;
    const following = pathPoints[index + 2] ?? next;
    const controlOne = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    };
    const controlTwo = {
      x: next.x - (following.x - current.x) / 6,
      y: next.y - (following.y - current.y) / 6,
    };

    commands.push(
      `C ${formatPathNumber(controlOne.x)} ${formatPathNumber(
        controlOne.y,
      )} ${formatPathNumber(controlTwo.x)} ${formatPathNumber(
        controlTwo.y,
      )} ${formatPathNumber(next.x)} ${formatPathNumber(next.y)}`,
    );
  }

  return commands.join(' ');
};

const createMaxChromaLookup = (hue: number): MaxChromaLookup => {
  const values = new Float64Array(MAX_CHROMA_LOOKUP_STEPS + 1);
  const toneStep = 100 / MAX_CHROMA_LOOKUP_STEPS;
  let maximumIndex = 0;

  for (let index = 0; index <= MAX_CHROMA_LOOKUP_STEPS; index += 1) {
    const chroma = Color.maxChroma(hue, index * toneStep);
    values[index] = chroma;
    if (chroma > values[maximumIndex]) maximumIndex = index;
  }

  let maximum: MaxChromaPoint = {
    tone: maximumIndex * toneStep,
    chroma: values[maximumIndex],
  };
  const refineStart = Math.max(0, maximumIndex - 1) * toneStep;
  const refineEnd =
    Math.min(MAX_CHROMA_LOOKUP_STEPS, maximumIndex + 1) * toneStep;

  for (let index = 1; index < MAX_CHROMA_REFINE_STEPS; index += 1) {
    const tone =
      refineStart +
      ((refineEnd - refineStart) * index) / MAX_CHROMA_REFINE_STEPS;
    const chroma = Color.maxChroma(hue, tone);
    if (chroma > maximum.chroma) maximum = { tone, chroma };
  }

  return {
    maxPoint: maximum,
    at: (tone) => {
      const boundedTone = clamp(tone, 0, 100);
      const position = boundedTone / toneStep;
      const lowerIndex = Math.min(
        MAX_CHROMA_LOOKUP_STEPS - 1,
        Math.floor(position),
      );
      const fraction = position - lowerIndex;
      const lower = values[lowerIndex];
      const upper = values[lowerIndex + 1];
      return lower + (upper - lower) * fraction;
    },
  };
};

/**
 * Maps the square to the HCT gamut while keeping the useful picker corners:
 * white, black, and the global maximum chroma for the selected hue.
 *
 * The upper part follows the gamut boundary from white to the maximum-chroma
 * point. The lower part follows that boundary back towards tone 0. Chroma is
 * normalized against the maximum available at the resulting tone, so every
 * point produced here is displayable in sRGB.
 */
const getFieldHct = (
  x: number,
  y: number,
  maxChromaPoint: MaxChromaPoint,
  maxChromaAt: (tone: number) => number,
) => {
  const boundedX = clamp(x, 0, 1);
  const boundedY = clamp(y, 0, 1);
  const peakTone = clamp(maxChromaPoint.tone, 0.1, 99.9);
  const upperToneSpan = 100 - peakTone;
  const upperToneRatio = upperToneSpan / 100;
  const upperBoundary = boundedX + boundedY / upperToneRatio;

  if (upperBoundary <= 1) {
    const chromaRatio = upperBoundary > 0 ? boundedX / upperBoundary : 0;
    const tone = 100 - upperBoundary * upperToneSpan;
    return {
      tone,
      chroma: chromaRatio * maxChromaAt(tone),
    };
  }

  const chromaRatio = boundedX;
  const toneDenominator = (1 - chromaRatio) / 100 + chromaRatio / peakTone;
  const tone = toneDenominator > 0 ? (1 - boundedY) / toneDenominator : 0;

  return {
    tone,
    chroma: chromaRatio * maxChromaAt(tone),
  };
};

const getFieldPosition = (
  chroma: number,
  tone: number,
  maxChromaPoint: MaxChromaPoint,
  maxChromaAt: (tone: number) => number,
) => {
  const peakTone = clamp(maxChromaPoint.tone, 0.1, 99.9);
  const toneMaxChroma = maxChromaAt(tone);
  const chromaRatio =
    toneMaxChroma > 0 ? clamp(chroma / toneMaxChroma, 0, 1) : 0;

  if (tone >= peakTone) {
    const upperToneSpan = 100 - peakTone;
    const upperBoundary = clamp((100 - tone) / upperToneSpan, 0, 1);
    return {
      x: upperBoundary * chromaRatio,
      y: (1 - chromaRatio) * (1 - tone / 100),
    };
  }

  return {
    x: chromaRatio,
    y:
      (1 - chromaRatio) * (1 - tone / 100) +
      chromaRatio * (1 - tone / peakTone),
  };
};

const formatCoordinate = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return String(rounded);
};

const normalizeHex = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return null;
  return `#${match[1].toUpperCase()}`;
};

const relativeLuminance = (color: Color) => {
  const toLinear = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const { r, g, b } = color.rgb;

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

export const ColorPicker = ({
  paletteKey,
  showTone = true,
}: ColorPickerProps = {}) => {
  const $themeConfig = useStore(themeConfigStore);
  const $themeService = useStore(themeServiceStore);
  const themeServiceVersion = useStore(themeServiceVersionStore);

  const [initialState] = useState(() => {
    const hex = paletteKey
      ? (() => {
          const override = themeConfigStore.get().palettes?.[paletteKey];
          if (typeof override === 'string') return override;
          const api = themeServiceStore.get();
          if (api) {
            try {
              const toneSource = api.context.sourceColor.tone;
              if (typeof override === 'function') {
                const { hue, chroma } = override(api.context);
                return Color.from({ hue, chroma, tone: toneSource }).hex;
              }

              if (override instanceof Color) {
                return override.init(api).hex;
              }

              return (
                api.context.variant
                  .palettesFor(api.context)
                  [paletteKey]?.getColor(toneSource).hex ?? '#888888'
              );
            } catch {
              // Fall back to the neutral placeholder below when the palette is unavailable.
            }
          }
          return '#888888';
        })()
      : (themeConfigStore.get().sourceColor as string);
    const color = Color.fromHex(hex);
    return { hex, hue: color.hue, chroma: color.chroma, tone: color.tone };
  });

  const [inputValue, setInputValue] = useState(initialState.hex);
  const [chromaInputValue, setChromaInputValue] = useState(() =>
    formatCoordinate(initialState.chroma),
  );
  const [toneInputValue, setToneInputValue] = useState(() =>
    formatCoordinate(initialState.tone),
  );

  const [hue, setHue] = useState(initialState.hue);
  const [chroma, setChroma] = useState(initialState.chroma);
  const [tone, setTone] = useState(initialState.tone);
  const [isHueInteracting, setIsHueInteracting] = useState(false);
  const colorFieldCanvasRef = useRef<HTMLCanvasElement>(null);
  const localEditPendingRef = useRef(false);
  // State setters are batched by React. Keep the last edited value available
  // synchronously so a blur/pointer-up event cannot publish the previous
  // render's color.
  const latestHexRef = useRef(initialState.hex);
  const renderHue = useDeferredValue(hue);

  const maxChromaLookup = useMemo(
    () => createMaxChromaLookup(renderHue),
    [renderHue],
  );
  const maxChromaPoint = maxChromaLookup.maxPoint;
  const maxChroma = useMemo(() => Color.maxChroma(hue, tone), [hue, tone]);
  const boundedChroma = clamp(chroma, 0, maxChroma);
  const updateChromaValue = useCallback(
    (nextChroma: number) => {
      const boundedNextChroma = clamp(nextChroma, 0, maxChroma);
      localEditPendingRef.current = true;
      latestHexRef.current = Color.from({
        hue,
        chroma: boundedNextChroma,
        tone,
      }).hex;
      setChroma(boundedNextChroma);
    },
    [hue, maxChroma, tone],
  );
  const currentColor = useMemo(
    () => Color.from({ hue, chroma: boundedChroma, tone }),
    [boundedChroma, hue, tone],
  );
  const hexColor = currentColor.hex;
  latestHexRef.current = hexColor;

  const surfaceLuminance = useMemo(() => {
    const fallback = Color.fromHex($themeConfig.isDark ? '#121212' : '#FFFBFE');
    if (!$themeService) return relativeLuminance(fallback);

    try {
      return relativeLuminance($themeService.colors.get('surface'));
    } catch {
      return relativeLuminance(fallback);
    }
  }, [
    $themeConfig.contrastLevel,
    $themeConfig.isDark,
    $themeConfig.palettes,
    $themeConfig.sourceColor,
    $themeConfig.variant,
    $themeService,
    themeServiceVersion,
  ]);

  const hueGradient = useMemo(() => {
    const colors = [];
    for (let h = 0; h <= 360; h += 30) {
      const hueMaxChroma = Color.maxChroma(h, tone);
      colors.push(
        Color.from({
          hue: h,
          chroma: Math.min(boundedChroma, hueMaxChroma),
          tone,
        }).hex,
      );
    }
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [boundedChroma, tone]);

  const contrastCurves = useMemo(() => {
    const colorAt = (chromaRatio: number, candidateTone: number) => {
      const toneMaxChroma = maxChromaLookup.at(candidateTone);
      return Color.from({
        hue: renderHue,
        chroma: toneMaxChroma * chromaRatio,
        tone: candidateTone,
      });
    };

    const findToneForLuminance = (
      chromaRatio: number,
      targetLuminance: number,
    ) => {
      let low = 0;
      let high = 100;
      const epsilon = 0.0005;

      for (
        let iteration = 0;
        iteration < CONTRAST_TONE_ITERATIONS;
        iteration += 1
      ) {
        const candidateTone = (low + high) / 2;
        const candidateLuminance = relativeLuminance(
          colorAt(chromaRatio, candidateTone),
        );

        if (Math.abs(candidateLuminance - targetLuminance) < epsilon) {
          return candidateTone;
        }

        if (candidateLuminance < targetLuminance) {
          low = candidateTone;
        } else {
          high = candidateTone;
        }
      }

      return (low + high) / 2;
    };

    return CONTRAST_RATIOS.flatMap((ratio) => {
      // For a light surface, the useful contrast line is darker; for a dark
      // surface, it is lighter. This is the same WCAG relationship used by
      // color.review and keeps the picker focused on foreground colors.
      const targetLuminance =
        surfaceLuminance >= 0.5
          ? (surfaceLuminance + 0.05) / ratio - 0.05
          : (surfaceLuminance + 0.05) * ratio - 0.05;

      if (targetLuminance < 0 || targetLuminance > 1) return [];

      const curvePoints = Array.from(
        { length: CONTRAST_CURVE_STEPS + 1 },
        (_, index) => {
          const chromaRatio = index / CONTRAST_CURVE_STEPS;
          const candidateTone = findToneForLuminance(
            chromaRatio,
            targetLuminance,
          );
          const fieldPosition = getFieldPosition(
            chromaRatio * maxChromaLookup.at(candidateTone),
            candidateTone,
            maxChromaPoint,
            maxChromaLookup.at,
          );
          return {
            x: fieldPosition.x * 100,
            y: fieldPosition.y * 100,
          };
        },
      );

      return [
        {
          ratio,
          labelY: curvePoints[0].y,
          path: createSmoothPath(curvePoints),
        },
      ];
    });
  }, [renderHue, maxChromaLookup, maxChromaPoint, surfaceLuminance]);

  const setColorFromHex = useCallback((hex: string) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return false;
    const color = Color.fromHex(normalized);
    latestHexRef.current = color.hex;
    setHue(color.hue);
    setChroma(color.chroma);
    setTone(color.tone);
    return true;
  }, []);

  const updateCurrentFromHex = useCallback(
    (hex: string) => {
      if (!normalizeHex(hex)) return;
      localEditPendingRef.current = true;
      setColorFromHex(hex);
    },
    [setColorFromHex],
  );

  const syncCurrentFromHex = useCallback(
    (hex: string) => {
      setColorFromHex(hex);
    },
    [setColorFromHex],
  );

  const updateThemeFromHex = useCallback(
    (hex: string) => {
      if (paletteKey) {
        const current = themeConfigStore.get().palettes?.[paletteKey];
        if (typeof current === 'string' && current === hex) return;

        const color = Color.fromHex(hex);
        themeConfigStore.set({
          ...themeConfigStore.get(),
          palettes: {
            ...themeConfigStore.get().palettes,
            [paletteKey]: () => ({
              hue: color.hue,
              chroma: color.chroma,
            }),
          },
        });
      } else {
        if (themeConfigStore.get().sourceColor === hex) return;
        themeConfigStore.set({ ...themeConfigStore.get(), sourceColor: hex });
      }
    },
    [paletteKey],
  );

  const currentStoreState = useMemo<StoreColorState>(() => {
    const fromColor = (color: Color): StoreColorState => ({
      hex: color.hex,
      hue: color.hue,
      chroma: color.chroma,
      tone: color.tone,
    });

    if (!paletteKey) {
      return fromColor(Color.fromHex($themeConfig.sourceColor as string));
    }

    const val = $themeConfig.palettes?.[paletteKey];
    if (typeof val === 'string') return fromColor(Color.fromHex(val));
    if ($themeService) {
      const toneSource = $themeService.context.sourceColor.tone;
      try {
        if (typeof val === 'function') {
          const { hue, chroma } = val($themeService.context);
          return fromColor(Color.from({ hue, chroma, tone: toneSource }));
        }

        const palette = val
          ? $themeService.palettes.get(paletteKey)
          : $themeService.context.variant.palettesFor($themeService.context)[
              paletteKey
            ];
        if (!palette) return fromColor(Color.fromHex(initialState.hex));
        return fromColor(palette.getColor(toneSource));
      } catch {
        // Fall back to the initial color when the palette is unavailable.
      }
    }
    return fromColor(Color.fromHex(initialState.hex));
  }, [
    $themeConfig.contrastLevel,
    $themeConfig.isDark,
    $themeConfig.palettes,
    $themeConfig.sourceColor,
    $themeConfig.variant,
    paletteKey,
    $themeService,
    initialState.hex,
    themeServiceVersion,
  ]);

  const currentStoreColor = currentStoreState.hex;

  const configuredPalette = paletteKey
    ? $themeConfig.palettes?.[paletteKey]
    : undefined;
  const paletteHasOverride = paletteKey
    ? Object.prototype.hasOwnProperty.call(
        $themeConfig.palettes ?? {},
        paletteKey,
      )
    : false;
  const isHueLocked =
    paletteKey === 'tertiary' &&
    isSecondaryHuePaletteOverride(configuredPalette);
  const paletteHasManualOverride =
    paletteHasOverride && !isSecondaryHuePaletteOverride(configuredPalette);
  const getDefaultPaletteColor = useCallback(() => {
    if (!paletteKey) return null;

    const api = themeServiceStore.get();
    if (!api) return null;

    const configuredSourceColor = themeConfigStore.get().sourceColor;
    const configuredColor =
      typeof configuredSourceColor === 'string'
        ? Color.fromHex(configuredSourceColor)
        : configuredSourceColor instanceof Color
          ? configuredSourceColor.init(api)
          : null;
    if (
      !configuredColor ||
      api.context.sourceColor.hex !== configuredColor.hex
    ) {
      api.context.update({ sourceColor: configuredSourceColor });
    }

    const palette = api.context.variant.palettesFor(api.context)[paletteKey];
    if (!palette) return null;

    palette.update(['sourceColor']);
    return palette.getColor(api.context.sourceColor.tone);
  }, [paletteKey]);
  const previousPaletteOverrideRef = useRef(paletteHasOverride);

  const themeUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastThemeUpdateRef = useRef(0);
  const lastPublishedThemeHexRef = useRef<string | null>(null);
  const pendingThemeHexRef = useRef<string | null>(null);
  const publishThemeUpdate = useCallback(
    (hex: string) => {
      lastPublishedThemeHexRef.current = hex;
      updateThemeFromHex(hex);
    },
    [updateThemeFromHex],
  );
  const scheduleThemeUpdate = useCallback(
    (hex: string) => {
      if (lastPublishedThemeHexRef.current === hex) return;
      pendingThemeHexRef.current = hex;

      const now = Date.now();
      const elapsed = now - lastThemeUpdateRef.current;
      const remaining = THEME_UPDATE_INTERVAL - elapsed;

      if (lastThemeUpdateRef.current === 0 || remaining <= 0) {
        if (themeUpdateTimerRef.current) {
          clearTimeout(themeUpdateTimerRef.current);
          themeUpdateTimerRef.current = null;
        }
        pendingThemeHexRef.current = null;
        lastThemeUpdateRef.current = now;
        publishThemeUpdate(hex);
        return;
      }

      if (!themeUpdateTimerRef.current) {
        themeUpdateTimerRef.current = setTimeout(() => {
          themeUpdateTimerRef.current = null;
          const pendingHex = pendingThemeHexRef.current;
          pendingThemeHexRef.current = null;
          if (!pendingHex) return;

          lastThemeUpdateRef.current = Date.now();
          publishThemeUpdate(pendingHex);
        }, remaining);
      }
    },
    [publishThemeUpdate],
  );

  const cancelThemeUpdate = useCallback(() => {
    if (themeUpdateTimerRef.current) {
      clearTimeout(themeUpdateTimerRef.current);
      themeUpdateTimerRef.current = null;
    }
    pendingThemeHexRef.current = null;
    lastPublishedThemeHexRef.current = null;
  }, []);

  const flushThemeUpdate = useCallback(() => {
    if (themeUpdateTimerRef.current) {
      clearTimeout(themeUpdateTimerRef.current);
      themeUpdateTimerRef.current = null;
    }

    const pendingHex = pendingThemeHexRef.current ?? latestHexRef.current;
    pendingThemeHexRef.current = null;
    if (
      !localEditPendingRef.current ||
      !pendingHex ||
      pendingHex === lastPublishedThemeHexRef.current
    ) {
      return;
    }

    lastThemeUpdateRef.current = Date.now();
    publishThemeUpdate(pendingHex);
  }, [publishThemeUpdate]);

  useEffect(() => {
    return () => {
      cancelThemeUpdate();
    };
  }, [cancelThemeUpdate]);

  useEffect(() => {
    const hadOverride = previousPaletteOverrideRef.current;
    previousPaletteOverrideRef.current = paletteHasOverride;

    if (!paletteKey || !hadOverride || paletteHasOverride) return;

    const defaultColor = getDefaultPaletteColor();
    if (!defaultColor) return;

    cancelThemeUpdate();
    localEditPendingRef.current = false;
    syncCurrentFromHex(defaultColor.hex);
  }, [
    cancelThemeUpdate,
    getDefaultPaletteColor,
    paletteHasOverride,
    paletteKey,
    syncCurrentFromHex,
  ]);

  const updateFieldFromPoint = useCallback(
    (clientX: number, clientY: number, element: HTMLDivElement) => {
      const bounds = element.getBoundingClientRect();
      const x = clamp((clientX - bounds.left) / (bounds.width || 1), 0, 1);
      const y = clamp((clientY - bounds.top) / (bounds.height || 1), 0, 1);
      const fieldHct = getFieldHct(x, y, maxChromaPoint, maxChromaLookup.at);

      localEditPendingRef.current = true;
      latestHexRef.current = Color.from({
        hue,
        chroma: fieldHct.chroma,
        tone: fieldHct.tone,
      }).hex;
      setTone(fieldHct.tone);
      setChroma(fieldHct.chroma);
    },
    [hue, maxChromaLookup.at, maxChromaPoint],
  );

  const updateFieldTone = useCallback(
    (nextTone: number) => {
      const boundedTone = clamp(nextTone, 0, 100);
      const nextMaxChroma = Color.maxChroma(hue, boundedTone);
      const nextChroma = Math.min(boundedChroma, nextMaxChroma);

      localEditPendingRef.current = true;
      latestHexRef.current = Color.from({
        hue,
        chroma: nextChroma,
        tone: boundedTone,
      }).hex;
      setTone(boundedTone);
      setChroma(nextChroma);
    },
    [boundedChroma, hue],
  );

  const handleFieldKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const chromaStep = Math.max(maxChroma / 100, 0.1);

    switch (event.key) {
      case 'ArrowLeft':
        updateChromaValue(boundedChroma - chromaStep);
        break;
      case 'ArrowRight':
        updateChromaValue(boundedChroma + chromaStep);
        break;
      case 'ArrowUp':
        updateFieldTone(tone + 1);
        break;
      case 'ArrowDown':
        updateFieldTone(tone - 1);
        break;
      case 'Home':
        updateChromaValue(0);
        break;
      case 'End':
        updateChromaValue(maxChroma);
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  const handleChromaInputChange = (value: string) => {
    setChromaInputValue(value);
    if (!value.trim()) return;

    const nextChroma = Number(value.replace(',', '.'));
    if (Number.isFinite(nextChroma)) {
      updateChromaValue(nextChroma);
    }
  };

  const handleToneInputChange = (value: string) => {
    setToneInputValue(value);
    if (!value.trim()) return;

    const nextTone = Number(value.replace(',', '.'));
    if (Number.isFinite(nextTone)) {
      updateFieldTone(nextTone);
    }
  };

  const handleHueChange = (nextHue: number) => {
    if (isHueLocked) return;

    const nextMaxChroma = Color.maxChroma(nextHue, tone);
    const nextChroma = Math.min(boundedChroma, nextMaxChroma);

    localEditPendingRef.current = true;
    latestHexRef.current = Color.from({
      hue: nextHue,
      chroma: nextChroma,
      tone,
    }).hex;
    setIsHueInteracting(true);
    setHue(nextHue);
    setChroma(nextChroma);
  };

  const endHueInteraction = useCallback(() => {
    flushThemeUpdate();
    setIsHueInteracting(false);
  }, [flushThemeUpdate]);

  useEffect(() => {
    if (chroma !== boundedChroma) {
      setChroma(boundedChroma);
    }
  }, [boundedChroma, chroma]);

  useEffect(() => {
    const canvas = colorFieldCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const fieldSize = isHueInteracting
      ? COLOR_FIELD_DRAG_SIZE
      : COLOR_FIELD_SIZE;
    const image = context.createImageData(fieldSize, fieldSize);
    context.imageSmoothingEnabled = true;

    for (let y = 0; y < fieldSize; y += 1) {
      const fieldY = y / (fieldSize - 1);

      for (let x = 0; x < fieldSize; x += 1) {
        const fieldX = x / (fieldSize - 1);
        const fieldHct = getFieldHct(
          fieldX,
          fieldY,
          maxChromaPoint,
          maxChromaLookup.at,
        );
        const { r, g, b } = Color.from({
          hue: renderHue,
          chroma: fieldHct.chroma,
          tone: fieldHct.tone,
        }).rgb;
        const pixel = (y * fieldSize + x) * 4;

        image.data[pixel] = r;
        image.data[pixel + 1] = g;
        image.data[pixel + 2] = b;
        image.data[pixel + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
  }, [isHueInteracting, maxChromaLookup, maxChromaPoint, renderHue]);

  useEffect(() => {
    const resolvedStoreColor =
      paletteKey && !paletteHasOverride
        ? (getDefaultPaletteColor()?.hex ?? currentStoreColor)
        : currentStoreColor;
    const resolvedStoreState = Color.fromHex(resolvedStoreColor);
    const storeMatchesLocal = paletteKey
      ? sameCoordinate(hue, resolvedStoreState.hue) &&
        sameCoordinate(boundedChroma, resolvedStoreState.chroma)
      : hexColor === resolvedStoreColor;

    if (storeMatchesLocal) {
      localEditPendingRef.current = false;
      lastPublishedThemeHexRef.current = null;
    } else if (localEditPendingRef.current) {
      scheduleThemeUpdate(hexColor);
    } else {
      cancelThemeUpdate();
      syncCurrentFromHex(resolvedStoreColor);
    }
    setInputValue(hexColor);
    setChromaInputValue(formatCoordinate(boundedChroma));
    setToneInputValue(formatCoordinate(tone));
  }, [
    boundedChroma,
    cancelThemeUpdate,
    currentStoreColor,
    hexColor,
    getDefaultPaletteColor,
    hue,
    paletteHasOverride,
    paletteKey,
    scheduleThemeUpdate,
    syncCurrentFromHex,
    tone,
    $themeConfig.palettes,
    $themeConfig.sourceColor,
  ]);

  const hueInputId = `color-picker-hue-${paletteKey ?? 'source'}`;
  const fieldPosition = getFieldPosition(
    boundedChroma,
    tone,
    maxChromaPoint,
    maxChromaLookup.at,
  );
  const chromaPosition = fieldPosition.x * 100;
  const tonePosition = fieldPosition.y * 100;

  const handleReset = () => {
    if (!paletteKey) return;

    cancelThemeUpdate();
    localEditPendingRef.current = false;

    const defaultHex = getDefaultPaletteColor()?.hex;
    const palettes = { ...themeConfigStore.get().palettes };
    delete palettes[paletteKey];
    themeConfigStore.set({ ...themeConfigStore.get(), palettes });

    if (defaultHex) {
      syncCurrentFromHex(defaultHex);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid items-start gap-5 sm:grid-cols-[minmax(0,1.15fr)_minmax(10rem,0.85fr)]">
        <div className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] items-stretch gap-1">
          <div className="relative min-w-0">
            {contrastCurves.map((curve) => {
              return (
                <span
                  key={curve.ratio}
                  className="absolute right-0 -translate-y-1/2 whitespace-nowrap text-label-small text-on-surface-variant"
                  style={{
                    top: `${curve.labelY}%`,
                    opacity: 1,
                  }}
                >
                  {curve.ratio}
                </span>
              );
            })}
          </div>
          <div
            className="relative aspect-square w-full touch-none select-none"
            role="slider"
            tabIndex={0}
            aria-label="Sélection HCT de la chroma et du ton avec courbes de contraste par rapport à surface : 3:1, 4.5:1 et 7:1"
            aria-valuemin={0}
            aria-valuemax={Math.round(maxChroma * 10) / 10}
            aria-valuenow={Math.round(boundedChroma * 10) / 10}
            aria-valuetext={`Chroma ${formatCoordinate(
              boundedChroma,
            )}, ton ${formatCoordinate(tone)}`}
            onKeyDown={handleFieldKeyDown}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateFieldFromPoint(
                event.clientX,
                event.clientY,
                event.currentTarget,
              );
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                updateFieldFromPoint(
                  event.clientX,
                  event.clientY,
                  event.currentTarget,
                );
              }
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onPointerCancel={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
          >
            <div
              className="absolute inset-0 overflow-hidden rounded-2xl ring-1 ring-inset ring-outline-variant shadow-sm"
              style={{ backgroundColor: hexColor }}
              aria-hidden="true"
            >
              <canvas
                ref={colorFieldCanvasRef}
                width={
                  isHueInteracting ? COLOR_FIELD_DRAG_SIZE : COLOR_FIELD_SIZE
                }
                height={
                  isHueInteracting ? COLOR_FIELD_DRAG_SIZE : COLOR_FIELD_SIZE
                }
                className="block size-full"
                aria-hidden="true"
              />
              <svg
                className="pointer-events-none absolute inset-0 size-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                shapeRendering="geometricPrecision"
                aria-hidden="true"
              >
                {contrastCurves.map((curve) => {
                  const curveStyle = CONTRAST_CURVE_STYLES[curve.ratio];

                  return (
                    <g key={curve.ratio}>
                      <path
                        d={curve.path}
                        fill="none"
                        stroke={curveStyle.color}
                        strokeOpacity={curveStyle.opacity}
                        strokeWidth={curveStyle.width}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
            <span
              className="pointer-events-none absolute size-5 rounded-full border-2 border-white shadow-[0_1px_5px_rgb(0_0_0/45%)]"
              style={{
                backgroundColor: hexColor,
                left: `${chromaPosition}%`,
                top: `${tonePosition}%`,
                transform: 'translate(-50%, -50%)',
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="grid gap-3">
          <TextField
            variant={'outlined'}
            value={inputValue}
            label="Hex"
            name={`color-${paletteKey ?? 'source'}-hex`}
            placeholder={'#AABBCC'}
            onChange={(value) => {
              setInputValue(value);
              updateCurrentFromHex(value);
            }}
            onBlur={() => {
              setInputValue(hexColor);
              flushThemeUpdate();
            }}
          />
          <TextField
            variant="outlined"
            type="number"
            value={chromaInputValue}
            label="Chroma"
            name={`color-${paletteKey ?? 'source'}-chroma`}
            min={0}
            max={maxChroma}
            step={0.1}
            onChange={handleChromaInputChange}
            onBlur={() => {
              setChromaInputValue(formatCoordinate(boundedChroma));
              flushThemeUpdate();
            }}
          />
          {showTone && (
            <TextField
              variant="outlined"
              type="number"
              value={toneInputValue}
              label="Tone"
              name={`color-${paletteKey ?? 'source'}-tone`}
              min={0}
              max={100}
              step={0.1}
              onChange={handleToneInputChange}
              onBlur={() => {
                setToneInputValue(formatCoordinate(tone));
                flushThemeUpdate();
              }}
            />
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex justify-between">
          <label
            htmlFor={hueInputId}
            className="text-body-small text-on-surface-variant"
          >
            Teinte principale
          </label>
          <span className="text-body-small text-on-surface-variant">
            {Math.round(hue)}°
          </span>
        </div>
        <div className="relative h-7 overflow-hidden rounded-full ring-1 ring-inset ring-outline-variant">
          <input
            id={hueInputId}
            type="range"
            min="0"
            max="360"
            step="0.1"
            value={hue}
            disabled={isHueLocked}
            onChange={(event) => handleHueChange(Number(event.target.value))}
            onPointerDown={() => setIsHueInteracting(true)}
            onPointerUp={endHueInteraction}
            onPointerCancel={endHueInteraction}
            onKeyDown={() => setIsHueInteracting(true)}
            onKeyUp={endHueInteraction}
            onBlur={endHueInteraction}
            className="slider h-full w-full cursor-pointer appearance-none"
            style={{ background: hueGradient }}
          />
        </div>
      </div>
      {paletteKey && paletteHasManualOverride && (
        <div className="flex justify-end">
          <Button variant="text" size="small" onClick={handleReset}>
            Réinitialiser
          </Button>
        </div>
      )}
      <style>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
          outline: none;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
          border: 2px solid rgb(0 0 0 / 10%);
          transform: scale(0.8);
          transition: transform 0.1s;
        }
        .slider:active::-webkit-slider-thumb {
          transform: scale(1);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
          border: 2px solid rgb(0 0 0 / 10%);
          transform: scale(0.8);
          transition: transform 0.1s;
        }
        .slider:active::-moz-range-thumb {
          transform: scale(1);
        }
      `}</style>
    </div>
  );
};
