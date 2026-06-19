import React, { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'section-apercu', label: 'Aperçu' },
  { id: 'section-palette', label: 'Palette' },
  { id: 'section-tokens', label: 'Tokens' },
] as const;

export const ThemeBuilderNav: React.FC = () => {
  const [active, setActive] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { threshold: 0.2, rootMargin: '0px 0px -55% 0px' },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="sticky top-4 z-10 flex justify-center mb-6 pointer-events-none">
      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-surface-container border border-outline-variant/40 shadow-md backdrop-blur-sm pointer-events-auto">
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => handleClick(e, id)}
            className={`px-4 py-1.5 rounded-full text-label-large transition-all duration-200 no-underline ${
              active === id
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
};
