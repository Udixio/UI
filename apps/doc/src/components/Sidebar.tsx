import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, classNames, SideSheet } from '@udixio/ui-react';
import { motion } from 'motion/react';

// ─── Nav mode ─────────────────────────────────────────────────────────────────

export type NavPage = {
  slug: string;
  label: string;
  href?: string;
};

export type NavGroup = {
  subCategory?: string;
  pages: NavPage[];
};

export type NavSection = {
  category: string;
  /** Shorthand for a single flat group with no sub-category label. */
  pages?: NavPage[];
  /** Full form: multiple groups, each with an optional sub-category label. */
  groups?: NavGroup[];
};

type NavSidebarProps = {
  mode: 'nav';
  title: string;
  sections: NavSection[];
  basePath?: string;
  current?: string | null;
};

const NavSidebar = ({
  title,
  sections,
  basePath = '',
  current = null,
}: Omit<NavSidebarProps, 'mode'>) => {
  const [activePage, setActivePage] = useState<string | null>(current);

  useEffect(() => {
    setActivePage(current);
  }, [current]);

  return (
    <SideSheet position="left" className="bg-surface-dim" title={title}>
      <nav className="flex flex-col p-2 h-full overflow-y-auto custom-scrollbar">
        {sections.map(({ category, pages, groups }) => {
          const normalizedGroups: NavGroup[] =
            groups ?? (pages ? [{ pages }] : []);

          return (
            <div key={category} className="mb-4">
              <div className="flex flex-col gap-1 rounded-3xl overflow-hidden">
                {normalizedGroups.map((group, groupIndex) => (
                  <Card
                    key={group.subCategory ?? groupIndex}
                    variant={'filled'}
                    className="rounded-lg overflow-hidden bg-surface-container-low pt-1"
                  >
                    {groupIndex === 0 && (
                      <div className="px-3 pt-2 pb-1 text-label-small text-outline">
                        {category}
                      </div>
                    )}
                    {group.subCategory && (
                      <div className="px-3 pt-2 pb-1 text-label-small text-outline-variant">
                        {group.subCategory}
                      </div>
                    )}
                    <div className={classNames('flex flex-col gap-1 p-1')}>
                      {group.pages.map(({ slug, label, href }) => (
                        <Button
                          key={slug}
                          size="small"
                          href={href ?? `${basePath}/${slug}`}
                          className={classNames('justify-start w-full', {
                            'bg-transparent shadow-none!': slug !== activePage,
                          })}
                          label={label}
                          aria-current={
                            slug === activePage ? 'page' : undefined
                          }
                          onClick={() => setActivePage(slug)}
                          variant="tonal"
                        />
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </SideSheet>
  );
};

// ─── TOC mode ─────────────────────────────────────────────────────────────────

type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

function slugify(text: string) {
  return (text || '')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type TocSidebarProps = {
  mode: 'toc';
};

const TocSidebar = () => {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const headingsRef = useRef<HeadingItem[]>([]);

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLHeadingElement>('main h1, main h2'),
    );

    if (nodes.length === 0) {
      setHeadings([]);
      return;
    }

    const items: HeadingItem[] = nodes.map((el) => {
      if (!el.id) {
        const id = slugify(el.textContent || 'section');
        let unique = id;
        let i = 2;
        while (document.getElementById(unique)) unique = `${id}-${i++}`;
        el.id = unique;
      }
      return {
        id: el.id,
        text: el.textContent || '',
        level: Number(el.tagName.replace('H', '')) || 2,
      };
    });

    headingsRef.current = items;
    setHeadings(items);
  }, []);

  // Scroll-based detection with adaptive threshold.
  // As the page approaches its bottom, the threshold grows from OFFSET toward
  // 90% of viewport height — this ensures headings that can never reach the
  // top threshold still activate in order, without any sudden "last heading wins" jump.
  useEffect(() => {
    if (headings.length === 0) return;

    const OFFSET = 120;

    const onScroll = () => {
      const items = headingsRef.current;
      const scrollY = window.scrollY;
      const innerHeight = window.innerHeight;
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - innerHeight,
      );

      const remaining = Math.max(0, maxScroll - scrollY);
      const t = maxScroll > 0 ? 1 - Math.min(1, remaining / innerHeight) : 0;
      const threshold = OFFSET + (innerHeight * 0.9 - OFFSET) * t;

      let current: string | null = null;
      for (const h of items) {
        const el = document.getElementById(h.id);
        if (!el) continue;
        const absTop = el.getBoundingClientRect().top + scrollY;
        if (absTop <= scrollY + threshold) {
          current = h.id;
        }
      }
      if (current) setActiveId(current);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 16;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveId(id);
      history.replaceState(null, '', `#${id}`);
    }
  };

  const title = headings.find((h) => h.level === 1)?.text;
  const sections = headings.filter((h) => h.level === 2);

  // The shell (and its width) renders unconditionally, even before headings
  // are known -- `headings` only populates once a post-mount effect scans
  // the page, and gating the whole `<aside>` on that left no space reserved
  // for it in the initial paint. That reserved 200px popping in ~1s later
  // shifted the entire centered content column left by 100px out from under
  // anything already mounted below it (e.g. a Switch mid-FLIP-baseline).
  return (
    <aside className="sticky top-0 h-screen p-4 pt-16 w-[200px]">
      {headings.length > 0 && (
        <>
          <div className="text-title-small text-on-surface-variant">
            On this page
          </div>
          {title && <p className="mt-2 text-title-large">{title}</p>}
          <nav className="flex flex-col mt-2 gap-1 w-fit">
            {sections.map((h) => (
              <div key={h.id} className="relative -mx-4">
                <Button
                  size="small"
                  variant="text"
                  className={classNames(
                    'text-on-surface-variant w-full justify-start',
                    {
                      'text-primary': h.id === activeId,
                    },
                  )}
                  aria-current={h.id === activeId ? 'location' : undefined}
                  href={`#${h.id}`}
                  onClick={(e) => handleClick(e, h.id)}
                >
                  {h.text}
                </Button>
                {h.id === activeId && (
                  <motion.div
                    layoutId="doc-sidebar-button"
                    className="absolute pointer-events-none h-full w-full border border-outline-variant top-0 left-0 rounded-xl"
                  />
                )}
              </div>
            ))}
          </nav>
        </>
      )}
    </aside>
  );
};

// ─── Unified export ───────────────────────────────────────────────────────────

export type SidebarProps = NavSidebarProps | TocSidebarProps;

export const Sidebar = (props: SidebarProps) => {
  if (props.mode === 'nav') {
    const { mode, ...rest } = props;
    return <NavSidebar {...rest} />;
  }
  return <TocSidebar />;
};

// ─── Theme nav data ───────────────────────────────────────────────────────────

export const THEME_SECTIONS: NavSection[] = [
  {
    category: 'Tools',
    pages: [{ slug: 'builder', label: 'Builder', href: '/theme/builder' }],
  },
  {
    category: '@udixio/ui-react',
    pages: [
      { slug: 'introduction', label: 'Introduction' },
      { slug: 'configuration', label: 'Configuration' },
      { slug: 'colors', label: 'Colors & Surfaces' },
      { slug: 'dark-mode', label: 'Dark mode' },
      { slug: 'sub-themes', label: 'Sub-themes' },
      { slug: 'typography', label: 'Typography' },
      { slug: 'variants', label: 'Variants' },
      { slug: 'palettes', label: 'Custom palettes' },
    ],
  },
  {
    category: '@udixio/theme',
    groups: [
      {
        pages: [
          { slug: 'advanced', label: 'Overview' },
          { slug: 'advanced/loader', label: 'Using loader()' },
          { slug: 'advanced/variants', label: 'Variants API' },
          { slug: 'advanced/palettes', label: 'Palettes API' },
          { slug: 'advanced/colors', label: 'Colors API' },
        ],
      },
      {
        subCategory: 'Plugins',
        pages: [
          { slug: 'advanced/plugins', label: 'Plugin system' },
          { slug: 'advanced/plugins/tailwind', label: 'TailwindPlugin' },
          { slug: 'advanced/plugins/font', label: 'FontPlugin' },
        ],
      },
    ],
  },
];

// ─── Get started nav data ─────────────────────────────────────────────────────

export const GETSTARTED_SECTIONS: NavSection[] = [
  {
    category: 'Getting started',
    pages: [
      { slug: 'introduction', label: 'Introduction' },
      { slug: 'react', label: 'React' },
      { slug: 'angular', label: 'Angular' },
    ],
  },
  {
    category: 'AI agents',
    pages: [{ slug: 'agents', label: 'Overview', href: '/agents' }],
  },
];
