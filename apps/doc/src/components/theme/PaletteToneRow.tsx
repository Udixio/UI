import React, { useMemo } from 'react';
import { API, ColorFromPalette } from '@udixio/theme';
import { hexFromArgb } from '@material/material-color-utilities';
import { AnimatePresence, motion } from 'motion/react';

type Props = {
  api: API | null | undefined;
  group: string;
  highlighted?: { name: string; color: ColorFromPalette } | null;
  // Optional label to indicate where the highlighted tone comes from
  sourceLabel?: string | null;
};

export const PaletteToneRow: React.FC<Props> = ({
  api,
  group,
  highlighted,
  sourceLabel,
}) => {
  const toneSteps = useMemo(
    () => Array.from({ length: 11 }, (_, i) => i * 10).reverse(),
    [],
  );

  const palette = useMemo(() => {
    const key = group;
    if (!api || !key) return null as any;
    try {
      return api.palettes.get(key as any);
    } catch (e) {
      return null as any;
    }
  }, [api, group]);

  if (!palette) return null;

  let highlightedTone = highlighted?.color.getTone();
  if (highlightedTone) {
    highlightedTone = Math.round(highlightedTone);
  }

  const roundedSelected =
    typeof highlightedTone === 'number' && !Number.isNaN(highlightedTone)
      ? Math.round(highlightedTone / 10) * 10
      : null;
  const needsExtra =
    typeof highlightedTone === 'number' && highlightedTone % 10 !== 0;

  const items = useMemo(() => {
    const base = toneSteps.map((t) => ({ t, kind: 'standard' as const }));
    if (needsExtra && highlightedTone != null) {
      let inserted = false;
      const out: { t: number; kind: 'standard' | 'extra' }[] = [];
      for (let i = 0; i < base.length; i++) {
        const curr = base[i].t; // descending order
        const prev = i === 0 ? 101 : base[i - 1].t; // 101 > 100 ensures proper comparison at start
        if (!inserted && highlightedTone <= prev && highlightedTone > curr) {
          out.push({ t: highlightedTone, kind: 'extra' });
          inserted = true;
        }
        out.push(base[i]);
      }
      if (!inserted) {
        // Append at the end if it's <= last tone (i.e., between 0 and -inf)
        out.push({ t: highlightedTone, kind: 'extra' });
      }
      return out;
    }
    return base;
  }, [toneSteps, needsExtra, highlightedTone]);

  return (
    <div className="">
      <motion.div
        className="flex items-end gap-1 py-1"
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {items.map(({ t, kind }) => {
            const isExtra = kind === 'extra';
            const hex = hexFromArgb(palette.tone(t));
            const textColor = t >= 60 ? '#000' : '#fff';
            const isSelected = !isExtra && !needsExtra && roundedSelected === t;
            return (
              <motion.div
                key={`${kind}-${t}`}
                className="relative flex flex-1 flex-col items-center"
                layout
                initial={
                  isExtra ? { opacity: 0, y: -12, scale: 0.9 } : (false as any)
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  isExtra
                    ? {
                        opacity: 0,
                        y: -12,
                        scale: 0.95,
                        pointerEvents: 'none',
                      }
                    : { opacity: 0 }
                }
                transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              >
                <motion.div
                  className={`w-full h-12 rounded border ${
                    isExtra
                      ? 'border-2 border-dashed border-primary ring-2 ring-primary/30'
                      : isSelected
                        ? 'border-primary ring-2 ring-primary/50 scale-[1.02]'
                        : 'border-outline-variant'
                  }`}
                  style={{ background: hex, color: textColor }}
                  title={`tone ${t}${isExtra ? ' (sélection)' : ''} ${hex}`}
                  layout
                />
                <div
                  className={`mt-1 text-body-small ${
                    isExtra
                      ? 'text-primary font-semibold'
                      : isSelected
                        ? 'text-primary font-semibold'
                        : 'text-on-surface-variant'
                  }`}
                >
                  {t}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PaletteToneRow;
