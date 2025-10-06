import React, { useMemo } from 'react';
import { API } from '@udixio/theme';
import { hexFromArgb } from '@material/material-color-utilities';

export type PaletteGroup =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'neutral'
  | 'neutral-variant'
  | 'error'
  | 'success'
  | 'others';

type Props = {
  api: API | null | undefined;
  group: PaletteGroup;
};

function mapGroupToPaletteKey(g: PaletteGroup): string | null {
  if (g === 'neutral-variant') return 'neutralVariant';
  if (
    g === 'primary' ||
    g === 'secondary' ||
    g === 'tertiary' ||
    g === 'neutral' ||
    g === 'error' ||
    g === 'success'
  ) {
    return g;
  }
  return null;
}

export const PaletteToneRow: React.FC<Props> = ({ api, group }) => {
  const toneSteps = useMemo(
    () => Array.from({ length: 11 }, (_, i) => i * 10).reverse(),
    [],
  );

  const palette = useMemo(() => {
    const key = mapGroupToPaletteKey(group);
    if (!api || !key) return null as any;
    try {
      return api.palettes.get(key as any);
    } catch (e) {
      return null as any;
    }
  }, [api, group]);

  if (!palette) return null;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1 py-1">
        {toneSteps.map((t) => {
          const hex = hexFromArgb(palette.tone(t));
          const textColor = t >= 60 ? '#000' : '#fff';
          return (
            <div key={t} className="flex flex-1 flex-col items-center">
              <div
                className="w-full h-12 rounded border border-outline-variant"
                style={{ background: hex, color: textColor }}
                title={`tone ${t} ${hex}`}
              />
              <div className="mt-1 text-body-small text-on-surface-variant">
                {t}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaletteToneRow;
