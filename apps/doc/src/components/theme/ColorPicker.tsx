import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  argbFromHex,
  Hct,
  hexFromArgb,
} from '@material/material-color-utilities';
import { themeConfigStore } from '@/stores/themeConfigStore.ts';
import { useStore } from '@nanostores/react';
import { TextField } from '@udixio/ui-react';
import { HexColorPicker } from 'react-colorful';
import { AnimatePresence, motion } from 'motion/react';

export const ColorPicker = () => {
  const $themeConfig = useStore(themeConfigStore);
  const [showPicker, setShowPicker] = useState(false);
  const [inputValue, setInputValue] = useState($themeConfig.sourceColor);

  const [hue, setHue] = useState(
    Hct.fromInt(argbFromHex($themeConfig.sourceColor)).hue,
  );
  const [chroma, setChroma] = useState(
    Hct.fromInt(argbFromHex($themeConfig.sourceColor)).chroma,
  );

  const [tone, setTone] = useState(
    Hct.fromInt(argbFromHex($themeConfig.sourceColor)).tone,
  );

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

  // Génération du dégradé pour Hue (arc-en-ciel)
  const hueGradient = useMemo(() => {
    const colors = [];
    for (let h = 0; h <= 360; h += 30) {
      const color = Hct.from(h, chroma, 50);
      const hex = hexFromArgb(color.toInt());
      colors.push(hex);
    }
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [chroma, tone]);

  // Génération du dégradé pour Chroma (saturation)
  const chromaGradient = useMemo(() => {
    const colors = [];
    for (let c = 0; c <= maxChroma; c += maxChroma / 10) {
      const color = Hct.from(hue, c, 50);
      const hex = hexFromArgb(color.toInt());
      colors.push(hex);
    }
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [hue, tone, maxChroma]);

  // Génération du dégradé pour Tone (clarté)
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

  const updateThemeFromHex = useCallback((hex: string) => {
    if ($themeConfig.sourceColor === hex) return;

    themeConfigStore.set({ ...themeConfigStore.get(), sourceColor: hex });
  }, []);

  // Throttle utility (leading + trailing)
  const throttle = useCallback(
    <T extends (...args: any[]) => void>(fn: T, wait: number) => {
      let last = 0;
      let timeout: any;
      return (...args: Parameters<T>) => {
        const now = Date.now();
        const remaining = wait - (now - last);
        if (remaining <= 0) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          last = now;
          fn(...args);
        } else {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            last = Date.now();
            fn(...args);
          }, remaining);
        }
      };
    },
    [],
  );

  const throttledUpdateCurrentFromHex = useMemo(
    () => throttle(updateCurrentFromHex, 50),
    [throttle, updateCurrentFromHex],
  );

  const throttledUpdateThemeFromHex = useMemo(
    () => throttle(updateThemeFromHex, 500),
    [throttle, updateThemeFromHex],
  );

  useEffect(() => {
    if (hexColor !== $themeConfig.sourceColor) {
      throttledUpdateThemeFromHex(hexColor);
    }
    setInputValue(hexColor);
  }, [hexColor, $themeConfig.sourceColor, throttledUpdateThemeFromHex]);

  return (
    <div className="space-y-6">
      {/* Prévisualisation de la couleur */}
      <div
        className="w-full h-24 rounded-xl shadow-sm border border-outline-variant flex items-center justify-center transition-colors duration-200 relative overflow-hidden group"
        style={{ backgroundColor: hexColor }}
      >
        <span className="bg-surface/90 text-on-surface px-3 py-1.5 rounded-md font-mono text-sm shadow-sm backdrop-blur-sm border border-outline/10 z-10">
          {hexColor}
        </span>
      </div>

      {/* Saisie directe de la couleur */}
      <div className="flex gap-4 items-end relative">
        <div className="flex-1">
          <TextField
            value={inputValue}
            label={'Couleur source'}
            name="color"
            placeholder={'#AABBCC'}
            supportingText={'Format hexadécimal'}
            onChange={(e) => {
              setInputValue(e.target.value);
              throttledUpdateCurrentFromHex(e.target.value);
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
                    onChange={throttledUpdateCurrentFromHex}
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
              style={{
                background: hueGradient,
              }}
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
              style={{
                background: chromaGradient,
              }}
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
              style={{
                background: toneGradient,
              }}
            />
          </div>
        </div>
      </div>

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
