import React, { useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { API } from '@udixio/theme';
import { hexFromArgb } from '@material/material-color-utilities';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { themeConfigStore } from '@/stores/themeConfigStore.ts';

type Props = { api: API | null | undefined; group: string };

const IND_W = 48;
const GAP = 8;
const SPRING = { stiffness: 360, damping: 28, mass: 0.7 };

function makeGradient(
  palette: ReturnType<API['palettes']['get']>,
  fromTone: number,
  toTone: number,
) {
  if (fromTone === toTone) return hexFromArgb(palette.tone(fromTone));
  const steps = Math.max(2, Math.round(Math.abs(fromTone - toTone) / 5) + 1);
  const stops = Array.from({ length: steps }, (_, i) => {
    const t = fromTone + (toTone - fromTone) * (i / (steps - 1));
    return hexFromArgb(palette.tone(Math.round(t)));
  });
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

export const PaletteToneRow: React.FC<Props> = ({ api, group }) => {
  const cwRef = useRef(400);
  const activeRef = useRef(false); // synchronous hover flag, immune to React batching

  const [tone, setTone] = useState(50);
  const [copied, setCopied] = useState(false);

  const themeConfig = useStore(themeConfigStore);

  const palette = useMemo(() => {
    if (!api || !group) return null;
    try {
      return api.palettes.get(group as any);
    } catch {
      return null;
    }
  }, [api, group, themeConfig]);

  const fullGradient = useMemo(
    () => (palette ? makeGradient(palette, 100, 0) : ''),
    [palette],
  );

  // ── MotionValues ──────────────────────────────────────────────────────────
  const cursorX = useMotionValue(0);
  const indW = useSpring(0, SPRING);
  const gapSpring = useSpring(0, SPRING);

  const indLeft = useTransform(
    [cursorX, indW],
    ([x, iw]: number[]) => x - iw / 2,
  );
  const leftW = useTransform(
    [cursorX, indW, gapSpring],
    ([x, iw, g]: number[]) => Math.max(0, x - iw / 2 - g),
  );
  const rightLeft = useTransform(
    [cursorX, indW, gapSpring],
    ([x, iw, g]: number[]) => x + iw / 2 + g,
  );

  const pillOpacity = useTransform(indW, [0, 8], [1, 0]);
  const textOpacity = useTransform(indW, [0, IND_W * 0.55, IND_W], [0, 0, 1]);

  if (!palette) return null;

  const leftGrad = makeGradient(palette, 100, tone);
  const rightGrad = makeGradient(palette, tone, 0);
  const indHex = hexFromArgb(palette.tone(tone));
  const contrastHex = hexFromArgb(palette.tone(tone >= 50 ? 0 : 100));

  const clampX = (x: number) =>
    Math.max(IND_W / 2 + GAP, Math.min(cwRef.current - IND_W / 2 - GAP, x));

  const xToTone = (x: number) =>
    Math.round(Math.max(0, Math.min(100, (1 - x / cwRef.current) * 100)));

  const triggerEnter = (x: number) => {
    cursorX.set(x);
    setTone(xToTone(x));
    indW.set(IND_W);
    gapSpring.set(GAP);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    activeRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    cwRef.current = rect.width;
    triggerEnter(clampX(e.clientX - rect.left));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    cwRef.current = rect.width;
    const x = clampX(e.clientX - rect.left);
    // If onMouseEnter was missed, activate from here
    if (!activeRef.current) {
      activeRef.current = true;
      triggerEnter(x);
      return;
    }
    cursorX.set(x);
    setTone(xToTone(x));
  };

  const handleMouseLeave = () => {
    activeRef.current = false;
    setCopied(false);
    indW.set(0);
    gapSpring.set(0);
  };

  const handleClick = () => {
    navigator.clipboard
      .writeText(hexFromArgb(palette.tone(tone)))
      .catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className="relative w-full h-12 cursor-crosshair"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Left : tone 100 → hovered tone */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 pointer-events-none"
        style={{
          width: leftW,
          background: leftGrad,
          borderRadius: '24px 12px 12px 24px',
        }}
      />

      {/* Indicator */}
      <motion.div
        className="absolute top-0 bottom-0 flex items-center justify-center overflow-hidden pointer-events-none"
        style={{
          left: indLeft,
          width: indW,
          background: indHex,
          borderRadius: '12px',
        }}
      >
        <motion.span
          className="text-label-small   select-none whitespace-nowrap"
          style={{ color: contrastHex, opacity: textOpacity }}
        >
          {copied ? '✓' : tone}
        </motion.span>
      </motion.div>

      {/* Right : hovered tone → tone 0 */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 pointer-events-none"
        style={{
          left: rightLeft,
          background: rightGrad,
          borderRadius: '12px 24px 24px 12px',
        }}
      />

      {/* Pill — on top (rendered last), covers split pieces at rest */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: fullGradient, opacity: pillOpacity }}
      />
    </div>
  );
};

export default PaletteToneRow;
