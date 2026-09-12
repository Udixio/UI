import React from 'react';
import { ThemeBuilderNav } from './ThemeBuilderNav';
import { ThemePreview } from './ThemePreview';
import { ThemePalette } from './ThemePalette';
import { ThemeTokens } from './ThemeTokens';

const SectionHeader: React.FC<{ title: string; desc: string }> = ({
  title,
  desc,
}) => (
  <div className="px-6 pt-8 pb-2">
    <div className="flex items-baseline gap-3 mb-1">
      <h2 className="text-headline-small text-on-surface">{title}</h2>
    </div>
    <p className="text-body-medium text-on-surface-variant">{desc}</p>
    <div className="mt-4 h-px bg-outline-variant" />
  </div>
);

export const ThemeBuilderContent: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      <ThemeBuilderNav />

      <section id="section-preview" className="scroll-mt-20">
        <SectionHeader
          title="Preview"
          desc="The theme applied to real interfaces. Change the color on the left to see the impact live."
        />
        <ThemePreview />
      </section>

      <section id="section-palette" className="scroll-mt-20">
        <SectionHeader
          title="Palette"
          desc="HCT tone ramps from 0 to 100 for each color family. The machinery that generates everything."
        />
        <ThemePalette />
      </section>

      <section id="section-tokens" className="scroll-mt-20">
        <SectionHeader
          title="Tokens"
          desc="Every token knows what it is for. Hover → copy HEX or var()."
        />
        <ThemeTokens />
      </section>
    </div>
  );
};
