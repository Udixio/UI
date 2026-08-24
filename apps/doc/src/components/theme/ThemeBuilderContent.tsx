import React from 'react';
import { ThemeBuilderNav } from './ThemeBuilderNav';
import { ThemeApercu } from './ThemeApercu';
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

      <section id="section-apercu" className="scroll-mt-20">
        <SectionHeader
          title="Aperçu"
          desc="Le thème appliqué sur des interfaces réelles. Modifie la couleur à gauche pour voir l'impact en direct."
        />
        <ThemeApercu />
      </section>

      <section id="section-palette" className="scroll-mt-20">
        <SectionHeader
          title="Palette"
          desc="Rampes de tons HCT 0 → 100 pour chaque famille de couleurs. La mécanique qui génère tout."
        />
        <ThemePalette />
      </section>

      <section id="section-tokens" className="scroll-mt-20">
        <SectionHeader
          title="Tokens"
          desc="Chaque token sait à quoi il sert. Hover → copie HEX ou var()."
        />
        <ThemeTokens />
      </section>
    </div>
  );
};
