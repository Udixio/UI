import {
  Fragment,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  isBackgroundChromaPaletteOverride,
  isDerivedPaletteOverride,
  isSecondaryHuePaletteOverride,
  resolveSourceColor,
  themeConfigStore,
  themeServiceStore,
  themeServiceVersionStore,
} from '@/stores/themeConfigStore.ts';
import { useStore } from '@nanostores/react';
import { Button, IconButton, TextField, Tooltip } from '@udixio/ui-react';
import { iInfo } from '@udixio/icons-rounded-400/info';
import { Color } from '@udixio/theme';

interface ColorPickerProps {
  paletteKey?: string;
}

const COLOR_FIELD_SIZE = 128;
const COLOR_FIELD_DRAG_SIZE = 48;
const MAX_CHROMA_LOOKUP_STEPS = 96;
const MAX_CHROMA_REFINE_STEPS = 8;
// 33 points and 10 bisections (tone to ±0.1): three curves cost ~20 ms
// instead of ~100 ms, and they are only computed once the hue is settled.
const CONTRAST_CURVE_STEPS = 32;
const CONTRAST_TONE_ITERATIONS = 10;
const CONTRAST_RATIOS = [3, 4.5, 7] as const;
const THEME_UPDATE_INTERVAL = 250;
/** WCAG 2 text contrast thresholds against the surface. */
const CONTRAST_LEVELS = [
  { label: 'AA', minimum: 4.5 },
  { label: 'AAA', minimum: 7 },
] as const;

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

const sameCoordinate = (left: number, right: number) =>
  Math.abs(left - right) < 0.05;

/**
 * Do two colors refer to the same palette recipe? Tone plays no part: a
 * palette has none, it comes from the source color.
 */
const samePaletteRecipe = (left: Color, right: Color) =>
  sameCoordinate(left.hue, right.hue) &&
  sameCoordinate(left.chroma, right.chroma);

const sameColor = (left: Color, right: Color) =>
  left.hue === right.hue &&
  left.chroma === right.chroma &&
  left.tone === right.tone;

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

export const ColorPicker = ({ paletteKey }: ColorPickerProps = {}) => {
  const $themeConfig = useStore(themeConfigStore);
  const $themeService = useStore(themeServiceStore);
  const themeServiceVersion = useStore(themeServiceVersionStore);

  const [initialColor] = useState<Color>(() => {
    if (!paletteKey)
      return resolveSourceColor(themeConfigStore.get().sourceColor);

    const override = themeConfigStore.get().palettes?.[paletteKey];
    if (typeof override === 'string') return Color.fromHex(override);
    const api = themeServiceStore.get();
    if (api) {
      try {
        const toneSource = api.context.sourceColor.tone;
        // The background level override derives from the inherited recipe;
        // only the palette resolved by the API knows that base.
        if (isBackgroundChromaPaletteOverride(override)) {
          return api.palettes.get(paletteKey).getColor(toneSource);
        }

        if (typeof override === 'function') {
          const { hue, chroma } = override(api.context);
          return Color.from({ hue, chroma, tone: toneSource });
        }

        if (override instanceof Color) {
          return override.init(api);
        }

        const palette = api.context.variant.palettesFor(api.context)[
          paletteKey
        ];
        if (palette) return palette.getColor(toneSource);
      } catch {
        // Fall back to the neutral placeholder below when the palette is unavailable.
      }
    }
    return Color.fromHex('#888888');
  });

  const [inputValue, setInputValue] = useState(initialColor.hex);

  const [hue, setHue] = useState(initialColor.hue);
  const [chroma, setChroma] = useState(initialColor.chroma);
  const [tone, setTone] = useState(initialColor.tone);
  const [isHueInteracting, setIsHueInteracting] = useState(false);
  const colorFieldCanvasRef = useRef<HTMLCanvasElement>(null);
  const localEditPendingRef = useRef(false);
  // State setters are batched by React. Keep the last edited value available
  // synchronously so a blur/pointer-up event cannot publish the previous
  // render's color.
  const latestColorRef = useRef<Color>(initialColor);
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
      latestColorRef.current = Color.from({
        hue,
        chroma: boundedNextChroma,
        tone,
      });
      setChroma(boundedNextChroma);
    },
    [hue, maxChroma, tone],
  );
  // The requested chroma stays in the state and in the published color; the
  // square and the ARGB clip to the gamut, the value comes back once the tone
  // allows it.
  const currentColor = useMemo(
    () => Color.from({ hue, chroma, tone }),
    [chroma, hue, tone],
  );
  const hexColor = currentColor.hex;

  // The hue ramp is always at tone 50: that is where the gamut is widest and
  // hues are most distinguishable. It follows the current chroma, floored at
  // half the max chroma at that tone to stay readable when the color is
  // nearly gray. Each hue clips to its own gamut.
  const hueGradient = useMemo(() => {
    const rampTone = 50;
    const rampChroma = Math.max(chroma, Color.maxChroma(hue, rampTone) / 2);
    const stops = Array.from(
      { length: 13 },
      (_, index) =>
        Color.from({ hue: index * 30, chroma: rampChroma, tone: rampTone }).hex,
    );
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [chroma, hue]);
  latestColorRef.current = currentColor;

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

  const contrastRatio = useMemo(() => {
    const colorLuminance = relativeLuminance(currentColor);
    const lighter = Math.max(colorLuminance, surfaceLuminance);
    const darker = Math.min(colorLuminance, surfaceLuminance);
    return (lighter + 0.05) / (darker + 0.05);
  }, [currentColor, surfaceLuminance]);

  const contrastCurves = useMemo(() => {
    // While dragging the hue, every step redraws the square; the curves wait
    // for the release so they do not block the frame.
    if (isHueInteracting) return [];
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
          path: createSmoothPath(curvePoints),
        },
      ];
    });
  }, [
    isHueInteracting,
    renderHue,
    maxChromaLookup,
    maxChromaPoint,
    surfaceLuminance,
  ]);

  const applyColor = useCallback((color: Color) => {
    latestColorRef.current = color;
    setHue(color.hue);
    setChroma(color.chroma);
    setTone(color.tone);
  }, []);

  const updateCurrentFromHex = useCallback(
    (hex: string) => {
      const normalized = normalizeHex(hex);
      if (!normalized) return;
      localEditPendingRef.current = true;
      applyColor(Color.fromHex(normalized));
    },
    [applyColor],
  );

  const updateTheme = useCallback(
    (color: Color) => {
      if (paletteKey) {
        const { hue, chroma } = color;
        themeConfigStore.set({
          ...themeConfigStore.get(),
          palettes: {
            ...themeConfigStore.get().palettes,
            [paletteKey]: () => ({ hue, chroma }),
          },
        });
      } else {
        const current = themeConfigStore.get().sourceColor;
        if (current instanceof Color && sameColor(current, color)) return;
        themeConfigStore.set({ ...themeConfigStore.get(), sourceColor: color });
      }
    },
    [paletteKey],
  );

  const currentStoreColor = useMemo<Color>(() => {
    if (!paletteKey) return resolveSourceColor($themeConfig.sourceColor);

    const val = $themeConfig.palettes?.[paletteKey];
    if (typeof val === 'string') return Color.fromHex(val);
    if ($themeService) {
      const toneSource = $themeService.context.sourceColor.tone;
      try {
        if (
          typeof val === 'function' &&
          !isBackgroundChromaPaletteOverride(val)
        ) {
          const { hue, chroma } = val($themeService.context);
          return Color.from({ hue, chroma, tone: toneSource });
        }

        const palette = val
          ? $themeService.palettes.get(paletteKey)
          : $themeService.context.variant.palettesFor($themeService.context)[
              paletteKey
            ];
        if (palette) return palette.getColor(toneSource);
      } catch {
        // Fall back to the initial color when the palette is unavailable.
      }
    }
    return initialColor;
  }, [
    $themeConfig.contrastLevel,
    $themeConfig.isDark,
    $themeConfig.palettes,
    $themeConfig.sourceColor,
    $themeConfig.variant,
    paletteKey,
    $themeService,
    initialColor,
    themeServiceVersion,
  ]);

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
    paletteHasOverride && !isDerivedPaletteOverride(configuredPalette);
  const getDefaultPaletteColor = useCallback(() => {
    if (!paletteKey) return null;

    const api = themeServiceStore.get();
    if (!api) return null;

    const configuredSourceColor = themeConfigStore.get().sourceColor;
    const configuredColor = resolveSourceColor(configuredSourceColor).init(api);
    if (!sameColor(api.context.sourceColor, configuredColor)) {
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
  const lastPublishedThemeColorRef = useRef<Color | null>(null);
  const pendingThemeColorRef = useRef<Color | null>(null);
  const publishThemeUpdate = useCallback(
    (color: Color) => {
      lastPublishedThemeColorRef.current = color;
      updateTheme(color);
    },
    [updateTheme],
  );
  const scheduleThemeUpdate = useCallback(
    (color: Color) => {
      const published = lastPublishedThemeColorRef.current;
      if (published && sameColor(published, color)) return;
      pendingThemeColorRef.current = color;

      const now = Date.now();
      const elapsed = now - lastThemeUpdateRef.current;
      const remaining = THEME_UPDATE_INTERVAL - elapsed;

      if (lastThemeUpdateRef.current === 0 || remaining <= 0) {
        if (themeUpdateTimerRef.current) {
          clearTimeout(themeUpdateTimerRef.current);
          themeUpdateTimerRef.current = null;
        }
        pendingThemeColorRef.current = null;
        lastThemeUpdateRef.current = now;
        publishThemeUpdate(color);
        return;
      }

      if (!themeUpdateTimerRef.current) {
        themeUpdateTimerRef.current = setTimeout(() => {
          themeUpdateTimerRef.current = null;
          const pending = pendingThemeColorRef.current;
          pendingThemeColorRef.current = null;
          if (!pending) return;

          lastThemeUpdateRef.current = Date.now();
          publishThemeUpdate(pending);
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
    pendingThemeColorRef.current = null;
    lastPublishedThemeColorRef.current = null;
  }, []);

  const flushThemeUpdate = useCallback(() => {
    if (themeUpdateTimerRef.current) {
      clearTimeout(themeUpdateTimerRef.current);
      themeUpdateTimerRef.current = null;
    }

    const pending = pendingThemeColorRef.current ?? latestColorRef.current;
    pendingThemeColorRef.current = null;
    const published = lastPublishedThemeColorRef.current;
    if (
      !localEditPendingRef.current ||
      (published && sameColor(published, pending))
    ) {
      return;
    }

    lastThemeUpdateRef.current = Date.now();
    publishThemeUpdate(pending);
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
    applyColor(defaultColor);
  }, [
    applyColor,
    cancelThemeUpdate,
    getDefaultPaletteColor,
    paletteHasOverride,
    paletteKey,
  ]);

  const updateFieldFromPoint = useCallback(
    (clientX: number, clientY: number, element: HTMLDivElement) => {
      const bounds = element.getBoundingClientRect();
      const x = clamp((clientX - bounds.left) / (bounds.width || 1), 0, 1);
      const y = clamp((clientY - bounds.top) / (bounds.height || 1), 0, 1);
      const fieldHct = getFieldHct(x, y, maxChromaPoint, maxChromaLookup.at);

      localEditPendingRef.current = true;
      latestColorRef.current = Color.from({
        hue,
        chroma: fieldHct.chroma,
        tone: fieldHct.tone,
      });
      setTone(fieldHct.tone);
      setChroma(fieldHct.chroma);
    },
    [hue, maxChromaLookup.at, maxChromaPoint],
  );

  const updateFieldTone = useCallback(
    (nextTone: number) => {
      const boundedTone = clamp(nextTone, 0, 100);

      localEditPendingRef.current = true;
      latestColorRef.current = Color.from({ hue, chroma, tone: boundedTone });
      setTone(boundedTone);
    },
    [chroma, hue],
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

  const handleHueChange = (nextHue: number) => {
    if (isHueLocked) return;

    localEditPendingRef.current = true;
    latestColorRef.current = Color.from({ hue: nextHue, chroma, tone });
    setIsHueInteracting(true);
    setHue(nextHue);
  };

  const endHueInteraction = useCallback(() => {
    flushThemeUpdate();
    setIsHueInteracting(false);
  }, [flushThemeUpdate]);

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
        ? (getDefaultPaletteColor() ?? currentStoreColor)
        : currentStoreColor;
    // A palette is replayed by the engine at the source's tone: compare its
    // recipe. The source is stored as is: exact equality.
    const storeMatchesLocal = paletteKey
      ? samePaletteRecipe(currentColor, resolvedStoreColor)
      : sameColor(currentColor, resolvedStoreColor);

    if (storeMatchesLocal) {
      localEditPendingRef.current = false;
      lastPublishedThemeColorRef.current = null;
    } else if (localEditPendingRef.current) {
      scheduleThemeUpdate(currentColor);
    } else {
      cancelThemeUpdate();
      applyColor(resolvedStoreColor);
    }
    setInputValue(hexColor);
  }, [
    applyColor,
    cancelThemeUpdate,
    currentColor,
    currentStoreColor,
    hexColor,
    getDefaultPaletteColor,
    paletteHasOverride,
    paletteKey,
    scheduleThemeUpdate,
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

    const defaultColor = getDefaultPaletteColor();
    const palettes = { ...themeConfigStore.get().palettes };
    delete palettes[paletteKey];
    themeConfigStore.set({ ...themeConfigStore.get(), palettes });

    if (defaultColor) {
      applyColor(defaultColor);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="grid min-w-0 gap-3">
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
          <div className="grid gap-1">
            <div className="relative h-7 overflow-hidden rounded-full ring-1 ring-inset ring-outline-variant">
              <input
                id={hueInputId}
                type="range"
                min="0"
                max="360"
                step="0.1"
                value={hue}
                disabled={isHueLocked}
                aria-label="Teinte principale"
                onChange={(event) =>
                  handleHueChange(Number(event.target.value))
                }
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
          <div className="flex items-center justify-between gap-3 text-label-medium">
            <div className="flex items-center gap-3">
              <p className="flex items-center gap-3" aria-live="polite">
                {CONTRAST_LEVELS.map(({ label, minimum }) => {
                  const passes = contrastRatio >= minimum;
                  return (
                    <span
                      key={label}
                      className={
                        passes ? 'text-success' : 'text-error line-through'
                      }
                    >
                      {label}
                    </span>
                  );
                })}
              </p>
              <Tooltip
                variant="rich"
                content={
                  <div className="grid gap-3">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-title-small">Contraste</span>
                      <span className="text-title-medium tabular-nums">
                        {Math.round(contrastRatio * 10) / 10}:1
                      </span>
                    </div>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body-small">
                      {CONTRAST_LEVELS.map(({ label, minimum }) => {
                        const passes = contrastRatio >= minimum;
                        return (
                          <Fragment key={label}>
                            <dt
                              className={
                                passes
                                  ? 'text-success'
                                  : 'text-error line-through'
                              }
                            >
                              {label}
                            </dt>
                            <dd className="text-on-surface-variant tabular-nums">
                              ≥ {minimum}:1
                            </dd>
                          </Fragment>
                        );
                      })}
                    </dl>
                    <p className="text-body-small text-on-surface-variant">
                      Par rapport à la surface du thème.
                    </p>
                  </div>
                }
              >
                <IconButton
                  icon={iInfo}
                  variant="standard"
                  size="xSmall"
                  label="À propos du contraste"
                />
              </Tooltip>
            </div>
            <span className="tabular-nums text-on-surface-variant">
              {formatCoordinate(hue)}°
            </span>
          </div>
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
