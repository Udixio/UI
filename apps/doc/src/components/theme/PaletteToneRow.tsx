import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { API } from '@udixio/theme';
import { createSpring, type SpringNumber } from '@udixio/motion/animate';
import {
  themeConfigStore,
  themeServiceVersionStore,
} from '@/stores/themeConfigStore.ts';

type Props = { api: API | null | undefined; group: string };

const IND_W = 48;
const GAP = 8;

/** The value of a ramp from `from` to `to` over `[start, end]`, clamped to the ends. */
const ramp = (value: number, [start, end]: [number, number], [from, to]: [number, number]) => {
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return from + (to - from) * t;
};

function makeGradient(
  palette: ReturnType<API['palettes']['get']>,
  fromTone: number,
  toTone: number,
) {
  if (fromTone === toTone) return palette.getColor(fromTone).hex;
  const steps = Math.max(2, Math.round(Math.abs(fromTone - toTone) / 5) + 1);
  const stops = Array.from({ length: steps }, (_, i) => {
    const t = fromTone + (toTone - fromTone) * (i / (steps - 1));
    return palette.getColor(Math.round(t)).hex;
  });
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

export const PaletteToneRow: React.FC<Props> = ({ api, group }) => {
  const cwRef = useRef(400);
  const activeRef = useRef(false); // synchronous hover flag, immune to React batching
  const cursorRef = useRef(0); // the pointer's x, followed at once (not by the spring)
  const springsRef = useRef<{ width: SpringNumber; gap: SpringNumber } | null>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  const [tone, setTone] = useState(50);
  const [copied, setCopied] = useState(false);

  const themeConfig = useStore(themeConfigStore);
  const themeServiceVersion = useStore(themeServiceVersionStore);

  const palette = useMemo(() => {
    if (!api || !group) return null;
    try {
      return api.palettes.get(group as any);
    } catch {
      return null;
    }
  }, [api, group, themeConfig, themeServiceVersion]);

  const fullGradient = useMemo(
    () => (palette ? makeGradient(palette, 100, 0) : ''),
    // Palette instances are updated in place by ThemeProvider. Subscribe to
    // the config snapshot as well so the cached gradient is rebuilt when the
    // dynamic theme changes.
    [palette, themeConfig, themeServiceVersion],
  );

  /**
   * Writes the pieces of the row for the pointer and the indicator's spring, straight to the DOM: a spring frame does not
   * render the component.
   */
  const paint = () => {
    const width = springsRef.current?.width.value ?? 0;
    const gap = springsRef.current?.gap.value ?? 0;
    const x = cursorRef.current;
    const indicator = indicatorRef.current;
    if (indicator) {
      indicator.style.left = `${x - width / 2}px`;
      indicator.style.width = `${width}px`;
    }
    if (leftRef.current) leftRef.current.style.width = `${Math.max(0, x - width / 2 - gap)}px`;
    if (rightRef.current) rightRef.current.style.left = `${x + width / 2 + gap}px`;
    if (pillRef.current) pillRef.current.style.opacity = String(ramp(width, [0, 8], [1, 0]));
    if (labelRef.current) labelRef.current.style.opacity = String(ramp(width, [IND_W * 0.55, IND_W], [0, 1]));
  };

  /** The two springs of the indicator, made on the first pointer move, and stopped when the row unmounts. */
  const springs = () => {
    if (!springsRef.current) {
      springsRef.current = {
        width: createSpring(0, { timing: 'spring.default.spatial', onUpdate: paint }),
        gap: createSpring(0, { timing: 'spring.default.spatial', onUpdate: paint }),
      };
    }
    return springsRef.current;
  };

  useEffect(
    () => () => {
      springsRef.current?.width.stop();
      springsRef.current?.gap.stop();
    },
    [],
  );

  if (!palette) return null;

  const leftGrad = makeGradient(palette, 100, tone);
  const rightGrad = makeGradient(palette, tone, 0);
  const indHex = palette.getColor(tone).hex;
  const contrastHex = palette.getColor(tone >= 50 ? 0 : 100).hex;

  const clampX = (x: number) =>
    Math.max(IND_W / 2 + GAP, Math.min(cwRef.current - IND_W / 2 - GAP, x));

  const xToTone = (x: number) =>
    Math.round(Math.max(0, Math.min(100, (1 - x / cwRef.current) * 100)));

  const triggerEnter = (x: number) => {
    cursorRef.current = x;
    setTone(xToTone(x));
    const { width, gap } = springs();
    width.to(IND_W);
    gap.to(GAP);
    paint();
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
    cursorRef.current = x;
    paint();
    setTone(xToTone(x));
  };

  const handleMouseLeave = () => {
    activeRef.current = false;
    setCopied(false);
    const { width, gap } = springs();
    width.to(0);
    gap.to(0);
  };

  const handleClick = () => {
    navigator.clipboard.writeText(palette.getColor(tone).hex).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className="relative w-full h-12 cursor-none overflow-hidden rounded-full"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Left : tone 100 → hovered tone */}
      <div
        ref={leftRef}
        className="absolute top-0 bottom-0 left-0 pointer-events-none"
        style={{
          width: 0,
          background: leftGrad,
          borderRadius: '24px 12px 12px 24px',
        }}
      />

      {/* Indicator */}
      <div
        ref={indicatorRef}
        className="absolute top-0 bottom-0 flex items-center justify-center overflow-hidden pointer-events-none"
        style={{
          left: 0,
          width: 0,
          background: indHex,
          borderRadius: '12px',
        }}
      >
        <span
          ref={labelRef}
          className="text-label-small   select-none whitespace-nowrap"
          style={{ color: contrastHex, opacity: 0 }}
        >
          {copied ? '✓' : tone}
        </span>
      </div>

      {/* Right : hovered tone → tone 0 */}
      <div
        ref={rightRef}
        className="absolute top-0 bottom-0 right-0 pointer-events-none"
        style={{
          left: 0,
          background: rightGrad,
          borderRadius: '12px 24px 24px 12px',
        }}
      />

      {/* Pill — on top (rendered last), covers split pieces at rest */}
      <div
        ref={pillRef}
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: fullGradient, opacity: 1 }}
      />
    </div>
  );
};

export default PaletteToneRow;
