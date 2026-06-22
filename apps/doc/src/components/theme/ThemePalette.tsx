import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  themeConfigStore,
  themeServiceStore,
} from '@/stores/themeConfigStore.ts';
import PaletteToneRow from './PaletteToneRow';
import { Icon } from '@udixio/ui-react';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
import { iKeyboardArrowUp } from '@udixio/icons-rounded-400/keyboard_arrow_up';

const FAMILIES = [
  {
    key: 'primary',
    label: 'Primary',
    desc: 'Brand principal — boutons, FAB, actions clés',
  },
  {
    key: 'secondary',
    label: 'Secondary',
    desc: 'Complémentaire — chips, filtres, actions secondaires',
  },
  {
    key: 'tertiary',
    label: 'Tertiary',
    desc: 'Accent — highlights contrastés, éléments décoratifs',
  },
  { key: 'neutral', label: 'Neutral', desc: 'Surfaces et textes principaux' },
  {
    key: 'neutralVariant',
    label: 'Neutral Variant',
    desc: 'Bordures, diviseurs, textes atténués',
  },
] as const;

export const ThemePalette: React.FC = () => {
  const $api = useStore(themeServiceStore);
  useStore(themeConfigStore);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    primary: true,
  });

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-3 p-6">
      {FAMILIES.map(({ key, label, desc }) => (
        <div
          key={key}
          className="rounded-2xl border border-outline-variant/30 overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggle(key)}
            className="w-full flex items-center justify-between p-4 bg-surface-container hover:bg-surface-container-high transition-colors text-left"
          >
            <div className="flex items-baseline gap-3 min-w-0">
              <span className="text-title-medium font-bold text-on-surface shrink-0">
                {label}
              </span>
              <span className="text-body-small text-on-surface-variant truncate">
                {desc}
              </span>
            </div>
            <Icon
              icon={expanded[key] ? iKeyboardArrowUp : iKeyboardArrowDown}
              className="text-on-surface-variant shrink-0 ml-2"
            />
          </button>
          {expanded[key] && (
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20">
              <PaletteToneRow api={$api} group={key} highlighted={null} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
