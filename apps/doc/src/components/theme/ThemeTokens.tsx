import React, { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  themeConfigStore,
  themeServiceStore,
  themeServiceVersionStore,
} from '@/stores/themeConfigStore.ts';
import type { Color } from '@udixio/theme';
import ColorTokenCard from './ColorTokenCard';

type TokenDef = {
  name: string;
  usage: string;
  onColorName?: string;
};
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
      {
        name: 'primary',
        onColorName: 'onPrimary',
        usage: 'Boutons CTA, FAB',
      },
      {
        name: 'primaryContainer',
        onColorName: 'onPrimaryContainer',
        usage: 'Chips, badges sélectionnés',
      },
    ],
  },
  {
    key: 'secondary',
    label: 'Secondary',

    tokens: [
      {
        name: 'secondary',
        onColorName: 'onSecondary',
        usage: 'Actions secondaires, filtres',
      },
      {
        name: 'secondaryContainer',
        onColorName: 'onSecondaryContainer',
        usage: 'Chips non sélectionnés',
      },
    ],
  },
  {
    key: 'tertiary',
    label: 'Tertiary',

    tokens: [
      {
        name: 'tertiary',
        onColorName: 'onTertiary',
        usage: 'Accents, highlights',
      },
      {
        name: 'tertiaryContainer',
        onColorName: 'onTertiaryContainer',
        usage: 'Badges décoratifs',
      },
    ],
  },
  {
    key: 'surface',
    label: 'Surface',

    tokens: [
      {
        name: 'surface',
        onColorName: 'onSurface',
        usage: 'Fond principal des écrans',
      },
      { name: 'surfaceDim', usage: 'Surface légèrement assombrie' },
      { name: 'surfaceBright', usage: 'Surface légèrement éclaircie' },
      {
        name: 'surfaceContainerLowest',
        usage: 'Couche 0, niveau le plus bas',
      },
      { name: 'surfaceContainerLow', usage: 'Couche 1' },
      { name: 'surfaceContainer', usage: 'Cartes, modales' },
      { name: 'surfaceContainerHigh', usage: 'Inputs, sidebars' },
      {
        name: 'surfaceContainerHighest',
        usage: 'Couche 4, niveau le plus haut',
      },
      {
        name: 'surfaceVariant',
        onColorName: 'onSurfaceVariant',
        usage: 'Surface secondaire, alias de la couche la plus haute',
      },
      { name: 'outline', usage: 'Bordures visibles' },
      { name: 'outlineVariant', usage: 'Bordures subtiles, diviseurs' },
      {
        name: 'inverseSurface',
        onColorName: 'inverseOnSurface',
        usage: 'Surface inversée, snackbars, tooltips',
      },
      {
        name: 'background',
        onColorName: 'onBackground',
        usage: 'Alias de la surface principale',
      },
      { name: 'surfaceTint', usage: 'Teinte de surface, alias de primary' },
    ],
  },
  {
    key: 'feedback',
    label: 'Feedback',

    tokens: [
      {
        name: 'error',
        onColorName: 'onError',
        usage: 'Champs invalides, alertes',
      },
      {
        name: 'errorContainer',
        onColorName: 'onErrorContainer',
        usage: "Fond messages d'erreur",
      },
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
  const matchesToken = (name: string) =>
    !q ||
    name.toLowerCase().includes(q) ||
    `--color-${name
      .toLowerCase()
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase()}`.includes(q);

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
        const tokens = group.tokens.filter(
          (t) =>
            matchesToken(t.name) ||
            (t.onColorName ? matchesToken(t.onColorName) : false),
        );
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
                const onColor = t.onColorName
                  ? colorMap.get(t.onColorName)
                  : undefined;
                return (
                  <ColorTokenCard
                    key={t.name}
                    name={t.name}
                    color={color}
                    onColor={onColor}
                    onColorName={t.onColorName}
                    usage={t.usage}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {visibleGroups.every((g) =>
        g.tokens.every(
          (t) =>
            !matchesToken(t.name) &&
            (!t.onColorName || !matchesToken(t.onColorName)),
        ),
      ) && (
        <div className="text-center py-12 text-on-surface-variant text-body-large">
          Aucun token trouvé pour « {query} »
        </div>
      )}
    </div>
  );
};
