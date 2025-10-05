import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { themeConfigStore } from '@/stores/themeConfigStore.ts';

interface TokenInfo {
  name: string; // e.g. --color-primary
  value: string; // e.g. #6750A4
}

function readColorTokens(): TokenInfo[] {
  if (typeof window === 'undefined') return [];
  // Do not use getComputedStyle; build the token list from known keys and display using CSS variables
  const cssVarNames = (
    document.documentElement.getAttribute('data-udx-color-keys') ??
    'surface surface-dim surface-bright surface-container-lowest surface-container-low surface-container surface-container-high surface-container-highest on-surface on-surface-variant outline outline-variant inverse-surface inverse-on-surface primary primary-dim on-primary primary-container on-primary-container primary-fixed primary-fixed-dim on-primary-fixed on-primary-fixed-variant inverse-primary secondary secondary-dim on-secondary secondary-container on-secondary-container secondary-fixed secondary-fixed-dim on-secondary-fixed on-secondary-fixed-variant tertiary tertiary-dim on-tertiary tertiary-container on-tertiary-container tertiary-fixed tertiary-fixed-dim on-tertiary-fixed on-tertiary-fixed-variant error error-dim on-error error-container on-error-container surface-variant surface-tint background on-background success success-dim on-success success-container on-success-container success-fixed success-fixed-dim on-success-fixed on-success-fixed-variant'
  )
    .split(/\s+/)
    .filter(Boolean);
  const tokens: TokenInfo[] = cssVarNames.map((k) => ({
    name: `--color-${k}`,
    value: `var(--color-${k})`,
  }));
  tokens.sort((a, b) => a.name.localeCompare(b.name));
  return tokens;
}

function isBaseColor(name: string) {
  // heuristics for grouping primary/secondary/... as first
  return /(primary|secondary|tertiary|success|error)(?!-)/.test(name);
}

export const ColorTokens: React.FC = () => {
  // subscribe to theme store so we re-render when color changes
  useStore(themeConfigStore);

  const [tick, setTick] = useState(0);

  // Observe style changes to update list as Tailwind/theme plugin injects CSS
  useEffect(() => {
    const observer = new MutationObserver(() => setTick((x) => x + 1));
    observer.observe(document.documentElement, {
      attributes: false,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);

  // recompute tokens when tick changes or store updates
  const tokens = useMemo(() => readColorTokens(), [tick]);

  // Group into rows: base color families and others
  const [families, others] = useMemo(() => {
    const fams: Record<string, TokenInfo[]> = {};
    const rest: TokenInfo[] = [];

    tokens.forEach((t) => {
      // name without leading --color-
      const key = t.name.replace(/^--color-/, '');
      const root = key.split('-')[0];
      if (
        ['primary', 'secondary', 'tertiary', 'success', 'error'].includes(root)
      ) {
        fams[root] ??= [];
        fams[root].push(t);
      } else {
        rest.push(t);
      }
    });

    for (const k of Object.keys(fams)) {
      fams[k].sort((a, b) => a.name.localeCompare(b.name));
    }
    rest.sort((a, b) => a.name.localeCompare(b.name));

    return [fams, rest] as const;
  }, [tokens]);

  const renderToken = (t: TokenInfo) => {
    const varName = t.name; // --color-xyz
    const base = varName.replace(/^--color-/, '');

    // Try to find a matching on-* or container counterpart for a better demo
    const onVar = `--color-on-${base.replace(/^on-/, '')}`;
    const bg = `var(${varName})`;

    // If current is an "on-" token, try to pair with its background (remove on-)
    const isOn = base.startsWith('on-');
    const bgBase = isOn ? base.replace(/^on-/, '') : base;
    const pairedBg = `var(--color-${bgBase})`;
    const pairedOn = `var(--color-on-${bgBase})`;

    const sampleStyle: React.CSSProperties = isOn
      ? { background: pairedBg, color: `var(${varName})` }
      : { background: bg, color: pairedOn };

    return (
      <div
        key={varName}
        className="flex items-center gap-3 p-2 rounded-lg border border-outline-variant/40 bg-surface-container"
      >
        <div
          className="h-10 w-16 rounded border border-outline-variant/40"
          style={{ background: isOn ? pairedBg : bg }}
          title={t.value}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-mono truncate">{varName}</div>
          <div className="text-xs text-on-surface-variant">{t.value}</div>
        </div>
        <div
          className="min-w-48 max-w-64 text-xs px-3 py-2 rounded border border-outline-variant/40"
          style={sampleStyle}
        >
          {base}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">Palette tokens</h2>
        <p className="text-sm text-on-surface-variant mb-4">
          Aperçu en temps réel de toutes les variables CSS de couleur générées
          (commençant par --color-). Modifiez la couleur source pour voir les
          mises à jour immédiates.
        </p>

        {/* Families first */}
        {(
          ['primary', 'secondary', 'tertiary', 'success', 'error'] as const
        ).map((family) => (
          <div key={family} className="mb-6">
            <h3 className="text-base font-semibold mb-2 capitalize">
              {family}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {(families[family] ?? []).map((t) => renderToken(t))}
            </div>
          </div>
        ))}

        {/* Others */}
        <div className="mt-8">
          <h3 className="text-base font-semibold mb-2">Autres</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {others.map((t) => renderToken(t))}
          </div>
        </div>
      </section>
    </div>
  );
};
