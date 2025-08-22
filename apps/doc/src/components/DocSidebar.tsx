import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, classNames } from '@udixio/ui-react';
import { motion } from 'motion/react';
// no external case libs to keep build simple

export type HeadingItem = {
  id: string;
  text: string;
  level: number; // 2 for h2, 3 for h3, etc.
};

function slugify(text: string) {
  // Basic slugify: lowercases, removes accents, replaces non-alphanumerics with '-'
  return (text || '')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const DocSidebar: React.FC = () => {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Extract headings from the document and ensure they have IDs
  useEffect(() => {
    const selector = 'main h1, main h2';
    const nodes = Array.from(
      document.querySelectorAll<HTMLHeadingElement>(selector),
    );

    if (nodes.length === 0) {
      setHeadings([]);
      return;
    }

    const items: HeadingItem[] = nodes.map((el) => {
      let id = el.id;
      if (!id) {
        id = slugify(el.textContent || 'section');
        // If id already used, add suffix
        let uniqueId = id;
        let i = 2;
        while (document.getElementById(uniqueId)) {
          uniqueId = `${id}-${i++}`;
        }
        el.id = uniqueId;
        id = uniqueId;
      }
      const level = Number(el.tagName.replace('H', '')) || 2;
      return { id, text: el.textContent || '', level };
    });

    setHeadings(items);
  }, []);

  // Setup IntersectionObserver for scrollspy
  useEffect(() => {
    if (headings.length === 0) return;

    const options: IntersectionObserverInit = {
      root: null,
      // Consider a section active when its heading crosses 20% from top
      rootMargin: '0px 0px -70% 0px',
      threshold: [0, 1.0],
    };

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      // Pick the entry that is intersecting and nearest the top
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) {
        const id = (visible[0].target as HTMLElement).id;
        setActiveId(id);
      } else {
        // If nothing intersecting, find the last heading above the viewport
        const scrollY = window.scrollY;
        let lastId: string | null = null;
        for (const h of headings) {
          const el = document.getElementById(h.id);
          if (!el) continue;
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (top <= scrollY + 80) {
            lastId = h.id;
          } else {
            break;
          }
        }
        if (lastId) setActiveId(lastId);
      }
    }, options);

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [headings]);

  const grouped = useMemo(() => headings, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      // Smooth scroll with slight offset for any fixed elements
      const y = el.getBoundingClientRect().top + window.scrollY - 16;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveId(id);
      history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <aside className="sticky top-0 h-screen  p-4 pt-16 r-16 w-[200px]">
      {grouped.length !== 0 && (
        <>
          <div className="text-title-small  text-on-surface-variant">
            On this page
          </div>
          <p className={'mt-2 text-title-large'}>
            {grouped.filter((h) => h.level == 1)[0].text}
          </p>
          <nav className="flex flex-col mt-2 gap-1 w-fit ">
            {grouped
              .filter((h) => h.level == 2)
              .map((h) => (
                <div className={'relative -mx-4'}>
                  <Button
                    size={'small'}
                    variant={'text'}
                    key={h.id}
                    className={classNames(
                      'text-on-surface-variant w-full justify-start',
                      {
                        'text-primary': h.id === activeId,
                      },
                    )}
                    activated={h.id === activeId}
                    href={`#${h.id}`}
                    onClick={(e) => handleClick(e, h.id)}
                    //
                  >
                    {h.text}
                  </Button>
                  {h.id === activeId && (
                    <motion.div
                      layoutId={'doc-sidebar-button'}
                      className={
                        ' absolute pointer-events-none h-full w-full border border-outline-variant top-0 left-0 rounded-xl'
                      }
                    ></motion.div>
                  )}
                </div>
              ))}
          </nav>
        </>
      )}
    </aside>
  );
};
