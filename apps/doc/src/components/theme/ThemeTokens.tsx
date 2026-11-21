import React, { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  themeConfigStore,
  themeServiceStore,
  themeServiceVersionStore,
} from '@/stores/themeConfigStore.ts';
import type { Color } from '@udixio/theme';
import { Chip, TextField } from '@udixio/ui-react';
import { iSearch } from '@udixio/icons-rounded-400/search';
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
        usage: 'CTA buttons, FAB',
      },
      {
        name: 'primaryContainer',
        onColorName: 'onPrimaryContainer',
        usage: 'Selected chips and badges',
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
        usage: 'Secondary actions, filters',
      },
      {
        name: 'secondaryContainer',
        onColorName: 'onSecondaryContainer',
        usage: 'Unselected chips',
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
        usage: 'Decorative badges',
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
        usage: 'Main screen background',
      },
      { name: 'surfaceDim', usage: 'Slightly darkened surface' },
      { name: 'surfaceBright', usage: 'Slightly lightened surface' },
      {
        name: 'surfaceContainerLowest',
        usage: 'Layer 0, lowest level',
      },
      { name: 'surfaceContainerLow', usage: 'Layer 1' },
      { name: 'surfaceContainer', usage: 'Cards, modals' },
      { name: 'surfaceContainerHigh', usage: 'Inputs, sidebars' },
      {
        name: 'surfaceContainerHighest',
        usage: 'Layer 4, highest level',
      },
      {
        name: 'surfaceVariant',
        onColorName: 'onSurfaceVariant',
        usage: 'Secondary surface, alias of the highest layer',
      },
      { name: 'outline', usage: 'Visible borders' },
      { name: 'outlineVariant', usage: 'Subtle borders, dividers' },
      {
        name: 'inverseSurface',
        onColorName: 'inverseOnSurface',
        usage: 'Inverted surface, snackbars, tooltips',
      },
      {
        name: 'background',
        onColorName: 'onBackground',
        usage: 'Alias of the main surface',
      },
      { name: 'surfaceTint', usage: 'Surface tint, alias of primary' },
    ],
  },
  {
    key: 'feedback',
    label: 'Feedback',

    tokens: [
      {
        name: 'error',
        onColorName: 'onError',
        usage: 'Invalid fields, alerts',
      },
      {
        name: 'errorContainer',
        onColorName: 'onErrorContainer',
        usage: 'Error message background',
      },
    ],
  },
];

const ALL_KEYS = ['all', ...GROUPS.map((g) => g.key)];
const CHIP_LABELS: Record<string, string> = {
  all: 'All',
  primary: 'Primary',
  secondary: 'Secondary',
  tertiary: 'Tertiary',
  surface: 'Surface',
  feedback: 'Feedback',
};

export const ThemeTokens: React.FC = () => {
  const $api = useStore(themeServiceStore, { ssr: 'initial' });
  useStore(themeConfigStore, { ssr: 'initial' });
  const themeServiceVersion = useStore(themeServiceVersionStore, {
    ssr: 'initial',
  });
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
    `--color-${name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`.includes(
      q,
    );

  const visibleGroups = GROUPS.filter(
    (g) => activeGroup === 'all' || g.key === activeGroup,
  );

  return (
    <div className="space-y-6 p-6">
      {/* Toolbar */}
      {/* The field, then the chips: the column is too narrow for a field and six chips in one row. */}
      <div className="flex flex-col gap-3">
        <TextField
          variant="outlined"
          label="Search for a token"
          name="token-search"
          placeholder="primary, --color-surface…"
          autoComplete="off"
          leadingIcon={iSearch}
          value={query}
          onChange={setQuery}
          className="w-full sm:max-w-sm"
        />
        <div
          role="group"
          aria-label="Token group"
          className="flex gap-2 flex-wrap"
        >
          {ALL_KEYS.map((key) => (
            // One group at a time: a chip's request to clear its own selection keeps it selected.
            <Chip
              key={key}
              label={CHIP_LABELS[key]}
              selected={activeGroup === key}
              onSelectedChange={() => setActiveGroup(key)}
            />
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

            {/* Token grid: as many columns as the width holds a hex and its copy icon in */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(9.5rem,100%),1fr))] gap-3">
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
          No token found for “{query}”
        </div>
      )}
    </div>
  );
};
