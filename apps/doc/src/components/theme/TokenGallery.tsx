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

    const q = query.trim().toLowerCase();
    if (!q) return tokens;
    return tokens.filter((t) => t.name.toLowerCase().includes(q));
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
            <h3 className="text-sm font-semibold text-on-surface-variant capitalize">
              {group === 'others' ? 'Autres' : group}
            </h3>
            <PaletteToneRow api={$themeApi} group={group as any} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {groups.get(group)!.map((t) => {
                const name = t.name;
                return <ColorTokenCard key={name} name={name} />;
              })}
            </div>
          </div>
        ))}
    </div>
  );
};

export default TokenGallery;
