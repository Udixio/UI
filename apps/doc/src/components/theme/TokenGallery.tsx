import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  themeConfigStore,
  themeServiceStore,
  themeServiceVersionStore,
} from '@/stores/themeConfigStore.ts';
import type { Color } from '@udixio/theme';
import { Card, Icon, TextField, useMotion } from '@udixio/ui-react';
import { defineMotion, loadLayoutEngine } from '@udixio/motion';
import PaletteToneRow from './PaletteToneRow';
import ColorTokenCard from './ColorTokenCard';
import { Collapsible } from './Collapsible';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
import { iKeyboardArrowUp } from '@udixio/icons-rounded-400/keyboard_arrow_up';

/**
 * A token of a group: it enters one step after the previous one, rising 8 px and growing from 98 %, and it moves to its
 * place when a filter removes the tokens before it.
 */
defineMotion('token-item', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 8, scale: 0.98 },
    { opacity: 1, y: 0, scale: 1 },
  ],
  stagger: 'normal',
  timing: 'spring.default.spatial',
});

const TokenItem = ({ name, color }: { name: string; color: Color }) => {
  const item = useMotion<HTMLDivElement>(['token-item', 'reflow']);
  return (
    <div ref={item.ref}>
      <ColorTokenCard name={name} color={color} />
    </div>
  );
};

// The palette names as the theme names them (`palette.name`), in display order.
const paletteOrder = [
  'primary',
  'secondary',
  'tertiary',
  'neutral',
  'neutralVariant',
  'error',
  'success',
] as const;

export const TokenGallery: React.FC = () => {
  const $themeApi = useStore(themeServiceStore, { ssr: 'initial' });

  useStore(themeConfigStore, { ssr: 'initial' }); // re-render on theme change
  const themeServiceVersion = useStore(themeServiceVersionStore, {
    ssr: 'initial',
  });
  const [query, setQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    { primary: true },
  );

  // The layout engine is loaded on demand: loading it now lets a filter move the tokens that remain.
  useEffect(() => {
    void loadLayoutEngine();
  }, []);

  const tokens = useMemo(() => {
    if (!$themeApi) {
      return null;
    }
    return Array.from($themeApi.colors.getAll().entries());
  }, [$themeApi, themeServiceVersion]);

  const filtered = useMemo(() => {
    if (!tokens) return [];

    const baseList = tokens;

    const q = query.trim().toLowerCase();
    if (!q) return baseList;

    return baseList.filter(([name]) => name.toLowerCase().includes(q));
  }, [tokens, query]);

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; color: Color }[]>();
    for (const t of filtered) {
      const fam = t[1].options?.palette.name ?? 'others';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-surface-container p-4 rounded-xl border border-outline-variant">
        <div className="flex-1">
          <TextField
            variant={'outlined'}
            name={'token-search'}
            label="Search tokens"
            placeholder="e.g. primary, surface, container..."
            supportingText={'Explore all color tokens available in the theme.'}
            value={query}
            onChange={setQuery}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-4">
        {[...groups.keys()]
          .sort((a, b) => {
            const ia = paletteOrder.indexOf(a as any);
            const ib = paletteOrder.indexOf(b as any);
            const sa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
            const sb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
            return sa - sb;
          })
          .map((group) => (
            <Card
              key={group}
              variant="filled"
              className="overflow-hidden border border-outline-variant"
            >
              <div
                onClick={() =>
                  setExpandedGroups((prev) => ({
                    ...prev,
                    [group]: !prev[group],
                  }))
                }
                className="flex items-center justify-between p-4 bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-title-medium font-bold text-on-surface capitalize tracking-tight">
                    {group === 'others' ? 'Others' : group}
                  </h3>
                  <span className="text-label-small px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                    {groups.get(group)?.length || 0} tokens
                  </span>
                </div>
                <div className="flex items-center gap-2 text-label-medium text-on-surface-variant">
                  {expandedGroups[group] ? 'Hide' : 'Show'}
                  <Icon
                    icon={
                      expandedGroups[group]
                        ? iKeyboardArrowUp
                        : iKeyboardArrowDown
                    }
                    className="text-xs"
                  />
                </div>
              </div>

              <Collapsible
                open={!!expandedGroups[group]}
                className="bg-surface-container-lowest"
              >
                <div className="p-4 space-y-4 border-t border-outline-variant">
                  <div className="bg-surface rounded-lg p-2 border border-outline-variant">
                    <PaletteToneRow api={$themeApi} group={group as any} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
                    {groups.get(group)!.map((t) => (
                      <TokenItem key={t.name} name={t.name} color={t.color} />
                    ))}
                  </div>
                </div>
              </Collapsible>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default TokenGallery;
