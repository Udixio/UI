import { useCallback, useEffect, useMemo, useState } from 'react';
import { argbFromHex, hexFromArgb } from '@material/material-color-utilities';
import { themeConfigStore, themeServiceStore } from '@/stores/themeConfigStore.ts';
import { useStore } from '@nanostores/react';
import { Button, TextField } from '@udixio/ui-react';
import { HexColorPicker } from 'react-colorful';
import { AnimatePresence, motion } from 'motion/react';
import { Hct } from '@udixio/theme';

interface ColorPickerProps {
  paletteKey?: string;
}

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
              return hexFromArgb(
                api.palettes.get(paletteKey as any).tone(toneSource),
              );
            } catch {}
          }
          return '#888888';
        })()
      : (themeConfigStore.get().sourceColor as string);
    const hct = Hct.fromInt(argbFromHex(hex));
    return { hex, hue: hct.hue, chroma: hct.chroma, tone: hct.tone };
  });

  const [showPicker, setShowPicker] = useState(false);
  const [inputValue, setInputValue] = useState(initialState.hex);

  const [hue, setHue] = useState(initialState.hue);
  const [chroma, setChroma] = useState(initialState.chroma);
  const [tone, setTone] = useState(initialState.tone);

  const [maxChroma, setMaxChroma] = useState(200);

  useEffect(() => {
    const maxChroma = Hct.from(hue, 200, 50).chroma;
    setMaxChroma(maxChroma);
  }, [tone, hue]);

  const currentColor = Hct.from(hue, chroma, tone);
  const hexColor = hexFromArgb(currentColor.toInt());

  const normalizeHex = (val: string) => {
    const trimmed = val.trim();
    const m = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
    if (!m) return null;
    return `#${m[1].toUpperCase()}`;
  };

  const hueGradient = useMemo(() => {
    const colors = [];
    for (let h = 0; h <= 360; h += 30) {
      const color = Hct.from(h, chroma, 50);
      const hex = hexFromArgb(color.toInt());
      colors.push(hex);
    }
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [chroma, tone]);

  const chromaGradient = useMemo(() => {
    const colors = [];
    for (let c = 0; c <= maxChroma; c += maxChroma / 10) {
      const color = Hct.from(hue, c, 50);
      const hex = hexFromArgb(color.toInt());
      colors.push(hex);
    }
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [hue, tone, maxChroma]);

  const toneGradient = useMemo(() => {
    const colors = [];
    for (let t = 0; t <= 100; t += 10) {
      const color = Hct.from(hue, chroma, t);
      const hex = hexFromArgb(color.toInt());
      colors.push(hex);
    }
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [hue, chroma]);

  const updateCurrentFromHex = useCallback((hex: string) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    const hct = Hct.fromInt(argbFromHex(normalized));
    setHue(hct.hue);
    setChroma(hct.chroma);
    setTone(hct.tone);
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
          const hct = Hct.fromInt(argbFromHex(hex));
          themeConfigStore.set({
            ...themeConfigStore.get(),
            palettes: {
              ...themeConfigStore.get().palettes,
              [paletteKey]: () => ({
                hue: hct.hue,
                chroma: hct.chroma,
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
        return hexFromArgb(
          $themeService.palettes.get(paletteKey as any).tone(toneSource),
        );
      } catch {}
    }
    return initialState.hex;
  }, [
    $themeConfig.palettes,
    $themeConfig.sourceColor,
    paletteKey,
    $themeService,
    initialState.hex,
  ]);

  useEffect(() => {
    if (hexColor !== currentStoreColor) {
      updateThemeFromHex(hexColor);
    }
    setInputValue(hexColor);
  }, [hexColor, currentStoreColor, updateThemeFromHex]);

  const handleReset = () => {
    const api = themeServiceStore.get();
    if (api && paletteKey) {
      const variantPalette = api.context.variant.palettes[paletteKey];
      if (variantPalette) {
        const toneSource = api.context.sourceColor.tone;
        const defaultHex = hexFromArgb(variantPalette.tone(toneSource));
        updateCurrentFromHex(defaultHex);
      }
    }
    const palettes = { ...themeConfigStore.get().palettes };
    delete palettes[paletteKey!];
    themeConfigStore.set({ ...themeConfigStore.get(), palettes });
  };

  return (
    <div className="space-y-6">
      {/* Saisie directe de la couleur */}
      <div className="flex gap-4 items-end relative">
        <div className="flex-1">
          <TextField
            variant={'outlined'}
            value={inputValue}
            label={paletteKey ? 'Couleur' : 'Couleur source'}
            name="color"
            placeholder={'#AABBCC'}
            onChange={(e) => {
              setInputValue(e.target.value);
              updateCurrentFromHex(e.target.value);
            }}
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="size-12 rounded-lg overflow-hidden border border-outline-variant shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            style={{ backgroundColor: hexColor }}
            aria-label="Ouvrir le sélecteur de couleur"
          />
          <AnimatePresence>
            {showPicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPicker(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 bottom-full mb-2 z-50 shadow-xl rounded-xl overflow-hidden"
                >
                  <HexColorPicker
                    color={hexColor}
                    onChange={updateCurrentFromHex}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-5">
        {/* Slider Hue */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-on-surface-variant">
              Teinte (Hue)
            </label>
            <span className="text-sm text-on-surface-variant font-mono">
              {Math.round(hue)}°
            </span>
          </div>
          <div className="relative h-6 rounded-full overflow-hidden ring-1 ring-inset ring-outline-variant/20">
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={(e) => setHue(Number(e.target.value))}
              className="w-full h-full appearance-none cursor-pointer slider opacity-100"
              style={{ background: hueGradient }}
            />
          </div>
        </div>

        {/* Slider Chroma */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-on-surface-variant">
              Saturation (Chroma)
            </label>
            <span className="text-sm text-on-surface-variant font-mono">
              {Math.round(chroma)}
            </span>
          </div>
          <div className="relative h-6 rounded-full overflow-hidden ring-1 ring-inset ring-outline-variant/20">
            <input
              type="range"
              min="0"
              max={maxChroma}
              value={chroma}
              onChange={(e) => setChroma(Number(e.target.value))}
              className="w-full h-full appearance-none cursor-pointer slider"
              style={{ background: chromaGradient }}
            />
          </div>
        </div>

        {/* Slider Tone */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-on-surface-variant">
              Luminosité (Tone)
            </label>
            <span className="text-sm text-on-surface-variant font-mono">
              {Math.round(tone)}
            </span>
          </div>
          <div className="relative h-6 rounded-full overflow-hidden ring-1 ring-inset ring-outline-variant/20">
            <input
              type="range"
              min="0"
              max="100"
              value={tone}
              onChange={(e) => setTone(Number(e.target.value))}
              className="w-full h-full appearance-none cursor-pointer slider"
              style={{ background: toneGradient }}
            />
          </div>
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
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(0, 0, 0, 0.1);
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
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(0, 0, 0, 0.1);
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
