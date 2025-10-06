import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  themeConfigStore,
  themeServiceStore,
} from '@/stores/themeConfigStore.ts';
import { API } from '@udixio/theme';
import * as Case from 'case'; // A richer UX gallery focusing on usability: search, filter, copy, and previews.

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

const familiesOrder = [
  'surface',
  'background',
  'primary',
  'secondary',
  'tertiary',
  'success',
  'error',
  'outline',
  'inverse',
  'on',
] as const;

function getFamily(name: string) {
  const key = name.replace(/^--color-/, '');
  const root = key.split('-')[0];
  return familiesOrder.includes(root as any) ? root : 'others';
}

export const TokenGallery: React.FC = () => {
  const $themeApi = useStore(themeServiceStore);

  useStore(themeConfigStore); // re-render on theme change
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

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
      const fam = getFamily(t.name);
      if (!map.has(fam)) map.set(fam, []);
      map.get(fam)!.push(t);
    }
    for (const [k, list] of map)
      list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [filtered]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1200);
    } catch (e) {
      // Clipboard not available or denied; ignore.
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          placeholder="Rechercher un token (ex: primary, on-surface...)"
          className="flex-1 px-3 py-2 rounded-md border border-outline-variant/40 bg-surface text-on-surface"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-2"></div>
      </div>

      {[...groups.keys()]
        .sort(
          (a, b) =>
            familiesOrder.indexOf(a as any) - familiesOrder.indexOf(b as any),
        )
        .map((group) => (
          <div key={group} className="space-y-2">
            <h3 className="text-sm font-semibold text-on-surface-variant capitalize">
              {group === 'others' ? 'Autres' : group}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {groups.get(group)!.map((t) => {
                const name = t.name;
                const base = name.replace(/^--color-/, '');
                const isOn = base.startsWith('on-');
                const bgBase = isOn ? base.replace(/^on-/, '') : base;
                const bg = `var(--color-${bgBase})`;
                const on = `var(--color-on-${bgBase})`;
                return (
                  <div
                    style={{
                      background: isOn ? bg : `var(${name})`,
                      color: on,
                    }}
                    key={name}
                    className="group flex items-center gap-3 p-4 rounded-lg border border-outline-variant bg-surface-container transition-all duration-500"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-label-large">{base}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(name)}
                      className="opacity-70 group-hover:opacity-100 text-xs px-2 py-1 rounded border border-outline-variant/40"
                      title="Copier le nom du token"
                    >
                      {copied === name ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
};

export default TokenGallery;
