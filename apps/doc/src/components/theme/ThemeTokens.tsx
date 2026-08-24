import React, { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  themeConfigStore,
  themeServiceStore,
  themeServiceVersionStore,
} from '@/stores/themeConfigStore.ts';
import type { Color } from '@udixio/theme';
import ColorTokenCard from './ColorTokenCard';

type TokenDef = { name: string; usage: string };
type GroupDef = {
  key: string;
  label: string;

  tokens: TokenDef[];
};

const GROUPS: GroupDef[] = [
  {
    key: 'primary',
    label: 'Primary',

    tokens: [
      { name: 'primary', usage: 'Boutons CTA, FAB' },
      { name: 'onPrimary', usage: 'Texte sur primary' },
      { name: 'primaryContainer', usage: 'Chips, badges sélectionnés' },
      { name: 'onPrimaryContainer', usage: 'Texte dans container' },
    ],
  },
  {
    key: 'secondary',
    label: 'Secondary',

    tokens: [
      { name: 'secondary', usage: 'Actions secondaires, filtres' },
      { name: 'onSecondary', usage: 'Texte sur secondary' },
      { name: 'secondaryContainer', usage: 'Chips non sélectionnés' },
      { name: 'onSecondaryContainer', usage: 'Texte dans container' },
    ],
  },
  {
    key: 'tertiary',
    label: 'Tertiary',

    tokens: [
      { name: 'tertiary', usage: 'Accents, highlights' },
      { name: 'onTertiary', usage: 'Texte sur tertiary' },
      { name: 'tertiaryContainer', usage: 'Badges décoratifs' },
      { name: 'onTertiaryContainer', usage: 'Texte dans container' },
    ],
  },
  {
    key: 'surface',
    label: 'Surface',

    tokens: [
      { name: 'surface', usage: 'Fond principal des écrans' },
      { name: 'surfaceContainer', usage: 'Cartes, modales' },
      { name: 'surfaceContainerHigh', usage: 'Inputs, sidebars' },
      { name: 'onSurface', usage: 'Texte principal' },
      { name: 'onSurfaceVariant', usage: 'Texte secondaire, placeholders' },
      { name: 'outline', usage: 'Bordures visibles' },
      { name: 'outlineVariant', usage: 'Bordures subtiles, diviseurs' },
    ],
  },
  {
    key: 'feedback',
    label: 'Feedback',

    tokens: [
      { name: 'error', usage: 'Champs invalides, alertes' },
      { name: 'onError', usage: 'Texte sur error' },
      { name: 'errorContainer', usage: "Fond messages d'erreur" },
      { name: 'onErrorContainer', usage: 'Texte dans error container' },
    ],
  },
];

const ALL_KEYS = ['all', ...GROUPS.map((g) => g.key)];
const CHIP_LABELS: Record<string, string> = {
  all: 'Tous',
  primary: 'Primary',
  secondary: 'Secondary',
  tertiary: 'Tertiary',
  surface: 'Surface',
  feedback: 'Feedback',
};

export const ThemeTokens: React.FC = () => {
  const $api = useStore(themeServiceStore);
  useStore(themeConfigStore);
  const themeServiceVersion = useStore(themeServiceVersionStore);
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');

  const colorMap = useMemo(() => {
    if (!$api) return new Map<string, Color>();
    const map = new Map<string, Color>();
    for (const [name, color] of $api.colors.getAll()) {
      map.set(name, color);
    }
    return map;
  }, [$api, themeServiceVersion]);

  const q = query.trim().toLowerCase();

  const visibleGroups = GROUPS.filter(
    (g) => activeGroup === 'all' || g.key === activeGroup,
  );

  return (
    <div className="space-y-6 p-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="search"
          placeholder="Rechercher un token…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 max-w-xs bg-surface-container border border-outline-variant rounded-xl px-4 py-2 text-body-medium text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary transition-colors"
        />
        <div className="flex gap-2 flex-wrap">
          {ALL_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveGroup(key)}
              className={`px-3 py-1.5 rounded-full text-label-large transition-all border ${
                activeGroup === key
                  ? 'bg-primary-container text-on-primary-container border-primary-container'
                  : 'text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
              }`}
            >
              {CHIP_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Groups */}
      {visibleGroups.map((group) => {
        const tokens = group.tokens.filter((t) => {
          if (!q) return true;
          return (
            t.name.toLowerCase().includes(q) ||
            `--color-${t.name
              .toLowerCase()
              .replace(/([a-z])([A-Z])/g, '$1-$2')
              .toLowerCase()}`.includes(q)
          );
        });
        if (tokens.length === 0) return null;

        return (
          <div key={group.key}>
            {/* Group header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-title-medium">{group.label}</span>
            </div>

            {/* Token grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {tokens.map((t) => {
                const color = colorMap.get(t.name);
                if (!color) return null;
                return (
                  <ColorTokenCard
                    key={t.name}
                    name={t.name}
                    color={color}
                    usage={t.usage}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {visibleGroups.every(
        (g) =>
          g.tokens.filter((t) => !q || t.name.toLowerCase().includes(q))
            .length === 0,
      ) && (
        <div className="text-center py-12 text-on-surface-variant text-body-large">
          Aucun token trouvé pour « {query} »
        </div>
      )}
    </div>
  );
};
