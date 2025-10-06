import React, { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  themeConfigStore,
  themeServiceStore,
} from '@/stores/themeConfigStore.ts';
import { ColorAlias, ColorFromPalette } from '@udixio/theme';
import { Card, classNames, TextField } from '@udixio/ui-react';
import PaletteToneRow from './PaletteToneRow';
import ColorTokenCard from './ColorTokenCard';
import { AnimatePresence, motion } from 'motion/react';
import { kebabCase } from 'change-case';

// A richer UX gallery focusing on usability: search, filter, copy, and previews.

type Token = { name: string; value: string };

const paletteOrder = [
  'Primary',
  'Secondary',
  'Tertiary',
  'Neutral',
  'NeutralVariant',
  'Error',
  'Success',
] as const;

type PaletteFamily = (typeof paletteOrder)[number] | 'others';

function getPaletteFamily(color: ColorFromPalette): PaletteFamily {
  return color.options.palette.name as PaletteFamily;
}

export const TokenGallery: React.FC = () => {
  const $themeApi = useStore(themeServiceStore);

  useStore(themeConfigStore); // re-render on theme change
  const [query, setQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedToneByGroup, setSelectedToneByGroup] = useState<
    Record<string, { name: string; color: ColorFromPalette } | null>
  >({});
  const [hoveredTokenByGroup, setHoveredTokenByGroup] = useState<
    Record<string, { name: string; color: ColorFromPalette } | null>
  >({});

  const tokens = useMemo(() => {
    if (!$themeApi) {
      return null;
    }
    return Array.from($themeApi.colors.getAll().entries());
  }, [$themeApi]);

  const filtered = useMemo(() => {
    if (!tokens) return [];

    const baseList = tokens.filter(([name]) => {
      return !kebabCase(name).includes('on-');
    });

    const q = query.trim().toLowerCase();
    if (!q) return baseList;

    return baseList.filter(([name]) => name.toLowerCase().includes(q));
  }, [tokens, query]);

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; color: ColorFromPalette }[]>();
    for (const t of filtered) {
      if (t[1] instanceof ColorAlias) {
        t[1] = t[1].color();
      }
      if (!(t[1] instanceof ColorFromPalette)) {
        console.error(t[1]);
        throw new Error('Invalid color type');
      }
      const fam = t[1].options.palette.name;
      if (!map.has(fam)) map.set(fam, []);
      map.get(fam)!.push({
        name: t[0],
        color: t[1],
      });
    }
    for (const [k, list] of map)
      list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [filtered]);

  const parseCssVarHex = (cssVarName: string): string | null => {
    if (typeof window === 'undefined') return null;
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVarName)
      .trim();
    if (!val) return null;
    // Normalize rgb(...) to hex if needed by creating a dummy element
    if (val.startsWith('#')) return val;
    // Attempt to compute actual color by assigning to a temp element
    const el = document.createElement('div');
    el.style.color = `var(${cssVarName})`;
    const rgb = getComputedStyle(el).color;
    el.remove();
    // rgb(a, r, g, b) -> convert
    const m = rgb.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
      const r = Number(m[1]).toString(16).padStart(2, '0');
      const g = Number(m[2]).toString(16).padStart(2, '0');
      const b = Number(m[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    return null;
  };

  // Animation variants for palette keys reveal
  const gridVariants = {
    hidden: {
      opacity: 0,
      height: 0,
    },
    show: {
      opacity: 1,
      height: 'auto',
      transition: { staggerChildren: 0.035, when: 'beforeChildren' },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
    exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15 } },
  } as const;
  const handleTokenHover = (name: string, color: ColorFromPalette) => {
    const group = getPaletteFamily(color);
    const hex = color.getHex();
    if (!hex) return;
    setSelectedToneByGroup((prev) => ({
      ...prev,
      [group]: { name, color },
    }));
    setHoveredTokenByGroup((prev) => ({
      ...prev,
      [group]: { name, color },
    }));
  };

  const handleTokenHoverEnd = (name: string, color: ColorFromPalette) => {
    const group = getPaletteFamily(color);
    setSelectedToneByGroup((prev) => ({ ...prev, [group]: null }));
    setHoveredTokenByGroup((prev) => ({ ...prev, [group]: null }));
  };

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <TextField
          variant={'outlined'}
          name={'token-search'}
          label="Search for a token"
          placeholder="Search for a token (eg: primary, surface...)"
          supportingText={
            'All the color keys (from udixio.css) with previews, search, copy and export.'
          }
          value={query}
          onChange={(value) => setQuery(value)}
        />
        <div className="flex gap-2"></div>
      </div>

      {[...groups.keys()]
        .sort((a, b) => {
          const ia = paletteOrder.indexOf(a as any);
          const ib = paletteOrder.indexOf(b as any);
          const sa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
          const sb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
          return sa - sb;
        })
        .map((group, index) => (
          <Card
            variant={'filled'}
            key={group}
            className={classNames(
              'space-y-2 bg-surface-container-highest px-4 -mx-4 mt-2 py-4',
              {
                'rounded-t-none ': index > 0,
                'rounded-b-none': index < groups.size - 1,
              },
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-on-surface-variant capitalize">
                {group === 'others' ? 'Autres' : group}
              </h3>
              <button
                className="text-sm px-2 py-1 rounded border border-outline-variant hover:bg-surface-container-high"
                onClick={() =>
                  setExpandedGroups((prev) => ({
                    ...prev,
                    [group]: !prev[group],
                  }))
                }
              >
                {expandedGroups[group]
                  ? 'Masquer les clés'
                  : 'Afficher les clés'}
              </button>
            </div>
            <PaletteToneRow
              api={$themeApi}
              group={group as any}
              highlighted={selectedToneByGroup[group] ?? null}
            />
            <AnimatePresence initial={false}>
              {expandedGroups[group] && (
                <motion.div
                  key={`${group}-grid`}
                  className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2"
                  variants={gridVariants}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                >
                  {groups.get(group)!.map((t) => {
                    const name = t.name;
                    return (
                      <motion.div key={name} variants={itemVariants} layout>
                        <ColorTokenCard
                          name={name}
                          color={t.color}
                          onColor={t.color}
                          onSelect={handleTokenHover}
                          onHoverEnd={() => handleTokenHoverEnd(name, t.color)}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
    </div>
  );
};

export default TokenGallery;
