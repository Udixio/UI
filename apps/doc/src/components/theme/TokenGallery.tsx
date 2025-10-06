import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  themeConfigStore,
  themeServiceStore,
} from '@/stores/themeConfigStore.ts';
import { API } from '@udixio/theme';
import * as Case from 'case';
import { TextField } from '@udixio/ui-react';
import PaletteToneRow from './PaletteToneRow';
import ColorTokenCard from './ColorTokenCard';
import { argbFromHex } from '@material/material-color-utilities';
import { AnimatePresence, motion } from 'motion/react';

// A richer UX gallery focusing on usability: search, filter, copy, and previews.

type Token = { name: string; value: string };

function readAllColorTokens({ colors }: API): Token[] {
  if (typeof window === 'undefined') return [];
  // Avoid getComputedStyle as requested; rely on known keys from CSS and display with CSS variables.

  const cssVarNames = Array.from(colors.getAll().keys()).map((k) =>
    Case.kebab(k),
  );

  const out: Token[] = cssVarNames.map((k) => ({
    name: `--color-${k}`,
    value: `var(--color-${k})`,
  }));
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const paletteOrder = [
  'neutral',
  'neutral-variant',
  'primary',
  'secondary',
  'tertiary',
  'error',
  'success',
] as const;

type PaletteFamily = (typeof paletteOrder)[number] | 'others';

function getPaletteFamily(name: string): PaletteFamily {
  const key = name.replace(/^--color-/, '');
  const base = key.startsWith('on-') ? key.replace(/^on-/, '') : key;

  // Direct palette prefixes
  if (base.startsWith('primary')) return 'primary';
  if (base.startsWith('secondary')) return 'secondary';
  if (base.startsWith('tertiary')) return 'tertiary';
  if (base.startsWith('error')) return 'error';
  if (base.startsWith('success')) return 'success';

  // Neutral-variant related
  if (
    base.startsWith('outline') ||
    base.startsWith('surface-variant') ||
    base.startsWith('on-surface-variant')
  ) {
    return 'neutral-variant';
  }

  // Neutral-related usages (derived from neutral palette)
  if (
    base === 'background' ||
    base.startsWith('surface') ||
    base.startsWith('inverse') ||
    base === 'on-background'
  ) {
    return 'neutral';
  }

  return 'others';
}

export const TokenGallery: React.FC = () => {
  const $themeApi = useStore(themeServiceStore);

  useStore(themeConfigStore); // re-render on theme change
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedToneByGroup, setSelectedToneByGroup] = useState<
    Record<string, number | null>
  >({});
  const [hoveredTokenByGroup, setHoveredTokenByGroup] = useState<
    Record<string, string | null>
  >({});

  useEffect(() => {
    const observer = new MutationObserver(() => setTick((x) => x + 1));
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);

  const tokens = useMemo(() => {
    if (!$themeApi) {
      return null;
    }
    return readAllColorTokens($themeApi);
  }, [$themeApi]);

  const filtered = useMemo(() => {
    if (!tokens) return [];

    // Always hide tokens that are explicit "on-" variants
    const baseList = tokens.filter((t) => !/--color-on-/.test(t.name));

    const q = query.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter((t) => t.name.toLowerCase().includes(q));
  }, [tokens, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Token[]>();
    for (const t of filtered) {
      const fam = getPaletteFamily(t.name);
      if (!map.has(fam)) map.set(fam, []);
      map.get(fam)!.push(t);
    }
    for (const [k, list] of map)
      list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [filtered]);

  const mapGroupToPaletteKey = (g: string): string | null => {
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
  };

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

  const rgbFromArgb = (argb: number) => ({
    r: (argb >> 16) & 0xff,
    g: (argb >> 8) & 0xff,
    b: argb & 0xff,
  });
  const dist2 = (
    a: { r: number; g: number; b: number },
    b: { r: number; g: number; b: number },
  ) => {
    const dr = a.r - b.r,
      dg = a.g - b.g,
      db = a.b - b.b;
    return dr * dr + dg * dg + db * db;
  };

  const nearestToneForHex = (group: string, hex: string): number | null => {
    if (!$themeApi) return null;
    const key = mapGroupToPaletteKey(group);
    if (!key) return null;
    let palette: any;
    try {
      palette = $themeApi.palettes.get(key as any);
    } catch (e) {
      palette = null;
    }
    if (!palette) return null;
    const target = rgbFromArgb(argbFromHex(hex));
    let bestTone = 0;
    let bestd = Number.POSITIVE_INFINITY;
    for (let t = 0; t <= 100; t++) {
      const rgb = rgbFromArgb(palette.tone(t));
      const d = dist2(rgb, target);
      if (d < bestd) {
        bestd = d;
        bestTone = t;
      }
    }
    return bestTone;
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

  const handleTokenHover = (name: string) => {
    const group = getPaletteFamily(name);
    const hex = parseCssVarHex(name);
    if (!hex) return;
    const tone = nearestToneForHex(group, hex);
    setSelectedToneByGroup((prev) => ({ ...prev, [group]: tone }));
    const label = name; // keep full token name; PaletteToneRow will prettify
    setHoveredTokenByGroup((prev) => ({ ...prev, [group]: label }));
  };

  const handleTokenHoverEnd = (name: string) => {
    const group = getPaletteFamily(name);
    setSelectedToneByGroup((prev) => ({ ...prev, [group]: null }));
    setHoveredTokenByGroup((prev) => ({ ...prev, [group]: null }));
  };

  return (
    <div className="space-y-4">
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
        .map((group) => (
          <div key={group} className="space-y-2">
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
              highlightedTone={selectedToneByGroup[group] ?? null}
              sourceLabel={hoveredTokenByGroup[group] ?? null}
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
                          onSelect={handleTokenHover}
                          onHoverEnd={() => handleTokenHoverEnd(name)}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
    </div>
  );
};

export default TokenGallery;
