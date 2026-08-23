import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  themeConfigStore,
  themeServiceStore,
} from '@/stores/themeConfigStore.ts';
import { useStore } from '@nanostores/react';
import { Button, TextField } from '@udixio/ui-react';
import { Color } from '@udixio/theme';

interface ColorPickerProps {
  paletteKey?: string;
}

const COLOR_FIELD_SIZE = 128;
const MAX_CHROMA_TONE_STEPS = 1000;
const CONTRAST_CURVE_STEPS = 64;
const CONTRAST_RATIOS = [3, 4.5, 7] as const;

const CONTRAST_CURVE_STYLES: Record<
  (typeof CONTRAST_RATIOS)[number],
  { color: string; dash?: string }
> = {
  3: { color: '#ffffff', dash: '2 1.5' },
  4.5: { color: '#ffe082' },
  7: { color: '#ff8a80', dash: '5 2' },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

interface MaxChromaPoint {
  tone: number;
  chroma: number;
}

const getMaxChromaPoint = (hue: number): MaxChromaPoint => {
  let maximum: MaxChromaPoint = { tone: 50, chroma: 0 };

  for (let index = 0; index <= MAX_CHROMA_TONE_STEPS; index += 1) {
    const tone = (index / MAX_CHROMA_TONE_STEPS) * 100;
    const chroma = Color.maxChroma(hue, tone);
    if (chroma > maximum.chroma) {
      maximum = { tone, chroma };
    }
  }

  return maximum;
};

const getFieldHct = (
  hue: number,
  x: number,
  y: number,
  maxChromaPoint: MaxChromaPoint,
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
      chroma: chromaRatio * Color.maxChroma(hue, tone),
    };
  }

  const chromaRatio = boundedX;
  const toneDenominator =
    (1 - chromaRatio) / 100 + chromaRatio / peakTone;
  const tone = toneDenominator > 0 ? (1 - boundedY) / toneDenominator : 0;

  return {
    tone,
    chroma: chromaRatio * Color.maxChroma(hue, tone),
  };
};

const getFieldPosition = (
  hue: number,
  chroma: number,
  tone: number,
  maxChromaPoint: MaxChromaPoint,
) => {
  const peakTone = clamp(maxChromaPoint.tone, 0.1, 99.9);
  const toneMaxChroma = Color.maxChroma(hue, tone);
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

  return (
    0.2126 * toLinear(r) +
    0.7152 * toLinear(g) +
    0.0722 * toLinear(b)
  );
};

export const ColorPicker = ({ paletteKey }: ColorPickerProps = {}) => {
  const $themeConfig = useStore(themeConfigStore);
  const $themeService = useStore(themeServiceStore);

  const [initialState] = useState(() => {
    const hex = paletteKey
      ? (() => {
          const override = themeConfigStore.get().palettes?.[paletteKey];
          if (typeof override === 'string') return override;
          const api = themeServiceStore.get();
          if (api) {
            try {
              const toneSource = api.context.sourceColor.tone;
              return api.palettes.get(paletteKey).getColor(toneSource).hex;
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
  const colorFieldCanvasRef = useRef<HTMLCanvasElement>(null);

  const maxChromaPoint = useMemo(() => getMaxChromaPoint(hue), [hue]);
  const maxChroma = useMemo(() => Color.maxChroma(hue, tone), [hue, tone]);
  const boundedChroma = clamp(chroma, 0, maxChroma);
  const updateChromaValue = useCallback(
    (nextChroma: number) => {
      setChroma(clamp(nextChroma, 0, maxChroma));
    },
    [maxChroma],
  );
  const currentColor = useMemo(
    () => Color.from({ hue, chroma: boundedChroma, tone }),
    [boundedChroma, hue, tone],
  );
  const hexColor = currentColor.hex;

  const surfaceColor = (() => {
    const fallback = Color.fromHex(
      $themeConfig.isDark ? '#121212' : '#FFFBFE',
    );
    if (!$themeService) return fallback;

    try {
      return $themeService.colors.get('surface');
    } catch {
      return fallback;
    }
  })();
  const surfaceLuminance = relativeLuminance(surfaceColor);

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
      const toneMaxChroma = Color.maxChroma(hue, candidateTone);
      return Color.from({
        hue,
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

      for (let iteration = 0; iteration < 20; iteration += 1) {
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

      const points = Array.from(
        { length: CONTRAST_CURVE_STEPS + 1 },
        (_, index) => {
          const chromaRatio = index / CONTRAST_CURVE_STEPS;
          const candidateTone = findToneForLuminance(
            chromaRatio,
            targetLuminance,
          );
          const fieldPosition = getFieldPosition(
            hue,
            chromaRatio * Color.maxChroma(hue, candidateTone),
            candidateTone,
            maxChromaPoint,
          );
          return `${fieldPosition.x * 100},${fieldPosition.y * 100}`;
        },
      ).join(' ');

      const labelTone = findToneForLuminance(1, targetLuminance);
      const labelPosition = getFieldPosition(
        hue,
        Color.maxChroma(hue, labelTone),
        labelTone,
        maxChromaPoint,
      );

      return [
        {
          ratio,
          labelX: labelPosition.x * 100,
          labelY: labelPosition.y * 100,
          points,
        },
      ];
    });
  }, [hue, maxChromaPoint, surfaceLuminance]);

  const updateCurrentFromHex = useCallback((hex: string) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    const color = Color.fromHex(normalized);
    setHue(color.hue);
    setChroma(color.chroma);
    setTone(color.tone);
  }, []);

  const updateThemeFromHex = useCallback(
    (hex: string) => {
      if (paletteKey) {
        const current = themeConfigStore.get().palettes?.[paletteKey];
        if (typeof current === 'string' && current === hex) return;

        if (paletteKey === 'primary') {
          themeConfigStore.set({
            ...themeConfigStore.get(),
            sourceColor: hex,
          });
        } else {
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
        }
      } else {
        if (themeConfigStore.get().sourceColor === hex) return;
        themeConfigStore.set({ ...themeConfigStore.get(), sourceColor: hex });
      }
    },
    [paletteKey],
  );

  const currentStoreColor = useMemo(() => {
    if (!paletteKey) return $themeConfig.sourceColor as string;
    const val = $themeConfig.palettes?.[paletteKey];
    if (typeof val === 'string') return val;
    if ($themeService) {
      const toneSource = $themeService.context.sourceColor.tone;
      try {
        return $themeService.palettes
          .get(paletteKey)
          .getColor(toneSource).hex;
      } catch {
        // Fall back to the initial color when the palette is unavailable.
      }
    }
    return initialState.hex;
  }, [
    $themeConfig.palettes,
    $themeConfig.sourceColor,
    paletteKey,
    $themeService,
    initialState.hex,
  ]);

  const updateFieldFromPoint = useCallback(
    (clientX: number, clientY: number, element: HTMLDivElement) => {
      const bounds = element.getBoundingClientRect();
      const x = clamp((clientX - bounds.left) / (bounds.width || 1), 0, 1);
      const y = clamp((clientY - bounds.top) / (bounds.height || 1), 0, 1);
      const fieldHct = getFieldHct(hue, x, y, maxChromaPoint);

      setTone(fieldHct.tone);
      setChroma(fieldHct.chroma);
    },
    [hue, maxChromaPoint],
  );

  const updateFieldTone = useCallback(
    (nextTone: number) => {
      const boundedTone = clamp(nextTone, 0, 100);
      const nextMaxChroma = Color.maxChroma(hue, boundedTone);

      setTone(boundedTone);
      setChroma(Math.min(boundedChroma, nextMaxChroma));
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
    const nextMaxChroma = Color.maxChroma(nextHue, tone);

    setHue(nextHue);
    setChroma(Math.min(boundedChroma, nextMaxChroma));
  };

  useEffect(() => {
    if (chroma !== boundedChroma) {
      setChroma(boundedChroma);
    }
  }, [boundedChroma, chroma]);

  useEffect(() => {
    const canvas = colorFieldCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const image = context.createImageData(COLOR_FIELD_SIZE, COLOR_FIELD_SIZE);

    for (let y = 0; y < COLOR_FIELD_SIZE; y += 1) {
      const fieldY = y / (COLOR_FIELD_SIZE - 1);

      for (let x = 0; x < COLOR_FIELD_SIZE; x += 1) {
        const fieldX = x / (COLOR_FIELD_SIZE - 1);
        const fieldHct = getFieldHct(
          hue,
          fieldX,
          fieldY,
          maxChromaPoint,
        );
        const { r, g, b } = Color.from({
          hue,
          chroma: fieldHct.chroma,
          tone: fieldHct.tone,
        }).rgb;
        const pixel = (y * COLOR_FIELD_SIZE + x) * 4;

        image.data[pixel] = r;
        image.data[pixel + 1] = g;
        image.data[pixel + 2] = b;
        image.data[pixel + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
  }, [hue, maxChromaPoint]);

  useEffect(() => {
    if (hexColor !== currentStoreColor) {
      updateThemeFromHex(hexColor);
    }
    setInputValue(hexColor);
    setChromaInputValue(formatCoordinate(boundedChroma));
    setToneInputValue(formatCoordinate(tone));
  }, [
    boundedChroma,
    currentStoreColor,
    hexColor,
    tone,
    updateThemeFromHex,
  ]);

  const hueInputId = `color-picker-hue-${paletteKey ?? 'source'}`;
  const fieldPosition = getFieldPosition(
    hue,
    boundedChroma,
    tone,
    maxChromaPoint,
  );
  const chromaPosition = fieldPosition.x * 100;
  const tonePosition = fieldPosition.y * 100;

  const handleReset = () => {
    if (!paletteKey) return;

    const api = themeServiceStore.get();
    if (api) {
      const variantPalette =
        api.context.variant.palettesFor(api.context)[paletteKey];
      if (variantPalette) {
        const toneSource = api.context.sourceColor.tone;
        const defaultHex = variantPalette.getColor(toneSource).hex;
        updateCurrentFromHex(defaultHex);
      }
    }
    const palettes = { ...themeConfigStore.get().palettes };
    delete palettes[paletteKey];
    themeConfigStore.set({ ...themeConfigStore.get(), palettes });
  };

  return (
    <div className="space-y-6">
      <div className="grid items-start gap-5 sm:grid-cols-[minmax(0,1.15fr)_minmax(10rem,0.85fr)]">
        <div
          className="relative aspect-square w-full touch-none select-none"
          role="slider"
          tabIndex={0}
          aria-label="Sélection de la chroma et du ton avec courbes de contraste par rapport à surface : 3:1, 4.5:1 et 7:1"
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
              width={COLOR_FIELD_SIZE}
              height={COLOR_FIELD_SIZE}
              className="block size-full"
              aria-hidden="true"
            />
            <svg
              className="pointer-events-none absolute inset-0 size-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {contrastCurves.map((curve) => {
                const curveStyle = CONTRAST_CURVE_STYLES[curve.ratio];
                const labelX = clamp(curve.labelX - 1, 4, 96);
                const labelY = clamp(curve.labelY - 2, 4, 96);

                return (
                  <g key={curve.ratio}>
                    <polyline
                      points={curve.points}
                      fill="none"
                      stroke="rgba(0, 0, 0, 0.72)"
                      strokeWidth="2.4"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polyline
                      points={curve.points}
                      fill="none"
                      stroke={curveStyle.color}
                      strokeWidth="1.1"
                      strokeDasharray={curveStyle.dash}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      fill={curveStyle.color}
                      fontSize="3.2"
                      fontWeight="700"
                      textAnchor="end"
                      stroke="rgba(0, 0, 0, 0.72)"
                      strokeWidth="1"
                      paintOrder="stroke"
                    >
                      {curve.ratio}:1
                    </text>
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
            onBlur={() => setInputValue(hexColor)}
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
            onBlur={() => setChromaInputValue(formatCoordinate(boundedChroma))}
          />
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
            onBlur={() => setToneInputValue(formatCoordinate(tone))}
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex justify-between">
          <label
            htmlFor={hueInputId}
            className="text-sm font-medium text-on-surface-variant"
          >
            Teinte (Hue)
          </label>
          <span className="font-mono text-sm text-on-surface-variant">
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
            onChange={(event) =>
              handleHueChange(Number(event.target.value))
            }
            className="slider h-full w-full cursor-pointer appearance-none"
            style={{ background: hueGradient }}
          />
        </div>
      </div>
      {paletteKey && paletteKey !== 'primary' && (
        <div className="flex justify-end">
          <Button variant="text" onClick={handleReset}>
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
