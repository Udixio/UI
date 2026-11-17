import { useEffect, useRef } from 'react';
import type { ExampleFramework } from '@/stores/exampleFrameworkStore';
import type { ComponentApiData } from '@/types/component-api';
import { useActiveComponentApi } from './useActiveComponentApi';
import { Card } from '@udixio/ui-react';

export type DocumentationNoteHtml = Partial<
  Record<
    ExampleFramework,
    Partial<Record<'devx' | 'a11y' | 'limitations', string>>
  >
>;

// The ids are rendered here, so the server markup and the hydrated one agree: the table of contents would otherwise
// add them to the headings after the server markup, and React reports the difference as a hydration mismatch.
const NOTE_META = {
  devx: {
    id: 'developer-experience',
    title: 'Developer experience',
    tone: 'bg-surface-container',
  },
  a11y: {
    id: 'accessibility',
    title: 'Accessibility',
    tone: 'bg-surface-container',
  },
  limitations: {
    id: 'known-limitations',
    title: 'Known limitations',
    tone: 'theme-warning',
  },
} as const;

/**
 * Renders trusted, pre-rendered markdown. React hydration never compares
 * `dangerouslySetInnerHTML` with the server markup, so when the stored
 * framework preference is applied before this island hydrates, the virtual
 * tree already holds the preferred framework's notes while the DOM still holds
 * the server's -- and nothing re-renders afterwards. The effect closes that
 * gap by writing the markup imperatively whenever it differs from the DOM.
 */
function NoteBody({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html) {
      ref.current.innerHTML = html;
    }
  }, [html]);

  return (
    <div
      ref={ref}
      className="prose-markdown text-sm leading-6 [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ComponentDocumentationNotes({
  api,
  html,
}: {
  api: ComponentApiData;
  html: DocumentationNoteHtml;
}) {
  const { activeFramework } = useActiveComponentApi(api);
  const notes = html[activeFramework] ?? {};
  const visibleNotes = (
    Object.keys(NOTE_META) as (keyof typeof NOTE_META)[]
  ).filter((key) => notes[key]);

  return (
    <aside
      className={`my-12 grid gap-4 ${visibleNotes.length > 1 ? 'lg:grid-cols-3' : ''}`}
      aria-label="API notes"
      hidden={visibleNotes.length === 0}
    >
      {visibleNotes.map((key) => (
        <Card
          key={key}
          className={`bg-surface-container p-6 ${NOTE_META[key].tone}`}
        >
          <h2 id={NOTE_META[key].id} className="mb-3 text-title-medium">
            {NOTE_META[key].title}
          </h2>
          <NoteBody html={notes[key] ?? ''} />
        </Card>
      ))}
    </aside>
  );
}
