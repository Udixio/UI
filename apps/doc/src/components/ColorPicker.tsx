import { useMemo, useState } from 'react';
import { Hct, hexFromArgb } from '@material/material-color-utilities';

export const ColorPicker = () => {
  const [hue, setHue] = useState(180);
  const [chroma, setChroma] = useState(50);
  const [tone, setTone] = useState(50);

  const currentColor = Hct.from(hue, chroma, tone);
  const hexColor = hexFromArgb(currentColor.toInt());

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
    const maxChroma = 150;
    for (let c = 0; c <= maxChroma; c += maxChroma / 10) {
      const color = Hct.from(hue, c, 50);
      const hex = hexFromArgb(color.toInt());
      colors.push(hex);
    }
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [hue, tone]);

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
            max="150"
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

      <style jsx>{`
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
