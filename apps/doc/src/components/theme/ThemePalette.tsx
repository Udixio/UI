import React from 'react';
import { useStore } from '@nanostores/react';
import {
  themeConfigStore,
  themeServiceStore,
} from '@/stores/themeConfigStore.ts';
import PaletteToneRow from './PaletteToneRow';

const FAMILIES = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'tertiary', label: 'Tertiary' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'neutralVariant', label: 'Neutral Variant' },
] as const;

export const ThemePalette: React.FC = () => {
  const $api = useStore(themeServiceStore);
  useStore(themeConfigStore);

  return (
    <div className="space-y-5 px-6 pb-6">
      {FAMILIES.map(({ key, label }) => (
        <div key={key}>
          <p className="text-label-medium text-on-surface mb-2">{label}</p>
          <PaletteToneRow api={$api} group={key} />
        </div>
      ))}
    </div>
  );
};
