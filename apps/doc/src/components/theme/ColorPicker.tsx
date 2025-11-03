import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  argbFromHex,
  Hct,
  hexFromArgb,
} from '@material/material-color-utilities';
import { themeConfigStore } from '@/stores/themeConfigStore.ts';
import { useStore } from '@nanostores/react';
import { TextField } from '@udixio/ui-react';

export const ColorPicker = () => {
  const $themeConfig = useStore(themeConfigStore);

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
  }, [hexColor, $themeConfig.sourceColor, throttledUpdateThemeFromHex]);

  return (
    <div className="p-5 max-w-md mx-auto font-sans">
      {/* Prévisualisation de la couleur */}
      <div
        className="w-full h-20 rounded-lg mb-5 flex items-center justify-center shadow-lg"
        style={{ backgroundColor: hexColor }}
      >
        <span className="bg-white bg-opacity-90 px-2 py-1 rounded font-bold text-gray-800">
          {hexColor}
        </span>
      </div>

      {/* Saisie directe de la couleur */}
      <div className="mb-6">
        <label className="block mb-2 font-medium text-gray-700">
          Couleur précise
        </label>
        <div className="flex gap-3 items-start">
          <TextField
            value={hexColor}
            label={'précise'}
            name="color"
            placeholder={'#AABBCC'}
            supportingText={'Saisir une couleur hexadécimale (#RRGGBB)'}
            onChange={(value) => {
              throttledUpdateCurrentFromHex(value);
            }}
          />

          <input
            type="color"
            value={hexColor}
            onChange={(e) => {
              throttledUpdateCurrentFromHex(e.target.value);
            }}
            aria-label="Choisir une couleur"
            className="size-15 rounded cursor-pointer p-0"
          />
        </div>
      </div>

      {/* Slider Hue */}
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">
          Hue: {Math.round(hue)}°
        </label>
        <div className="relative h-5 rounded-full overflow-hidden shadow-md">
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            className="w-full h-full appearance-none cursor-pointer slider"
            style={{
              background: hueGradient,
              WebkitAppearance: 'none',
              MozAppearance: 'none',
            }}
          />
        </div>
      </div>

      {/* Slider Chroma */}
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">
          Chroma: {Math.round(chroma)}
        </label>
        <div className="relative h-5 rounded-full overflow-hidden shadow-md">
          <input
            type="range"
            min="0"
            max={maxChroma}
            value={chroma}
            onChange={(e) => setChroma(Number(e.target.value))}
            className="w-full h-full appearance-none cursor-pointer slider"
            style={{
              background: chromaGradient,
              WebkitAppearance: 'none',
              MozAppearance: 'none',
            }}
          />
        </div>
      </div>

      {/* Slider Tone */}
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">
          Tone: {Math.round(tone)}
        </label>
        <div className="relative h-5 rounded-full overflow-hidden shadow-md">
          <input
            type="range"
            min="0"
            max="100"
            value={tone}
            onChange={(e) => setTone(Number(e.target.value))}
            className="w-full h-full appearance-none cursor-pointer slider"
            style={{
              background: toneGradient,
              WebkitAppearance: 'none',
              MozAppearance: 'none',
            }}
          />
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          border: 2px solid #333;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          border: 2px solid #333;
          -moz-appearance: none;
        }
      `}</style>
    </div>
  );
};
