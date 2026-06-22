import React, { useEffect, useState } from 'react';
import { Tab, Tabs } from '@udixio/ui-react';

const SECTIONS = [
  { id: 'section-apercu', label: 'Aperçu' },
  { id: 'section-palette', label: 'Palette' },
  { id: 'section-tokens', label: 'Tokens' },
] as const;

export const ThemeBuilderNav: React.FC = () => {
  const [active, setActive] = useState<number>(0);

  useEffect(() => {
    const scrollRoot = document.getElementById('builder-scroll');
    if (!scrollRoot) return;

    const handleScroll = () => {
      const containerRect = scrollRoot.getBoundingClientRect();
      const threshold = containerRect.top + containerRect.height * 0.5;
      let current = 0;
      SECTIONS.forEach(({ id }, index) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= threshold) current = index;
      });
      setActive(current);
    };

    scrollRoot.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => scrollRoot.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Tabs
      selectedTab={active}
      className={() => ({
        tabs: 'sticky w-fit inset-0 mx-auto top-4 z-10 mb-6 rounded-full overflow-hidden bg-surface-container-high shadow-md',
      })}
    >
      {SECTIONS.map(({ id, label }) => (
        <Tab
          key={label}
          label={label}
          onClick={() =>
            document
              .getElementById(id)
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          className={() => ({
            tab: 'rounded-full',
          })}
        />
      ))}
    </Tabs>
  );
};
