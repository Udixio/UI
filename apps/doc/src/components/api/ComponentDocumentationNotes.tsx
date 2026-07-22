import type { ExampleFramework } from '@/stores/exampleFrameworkStore';
import type { ComponentApiData } from '@/types/component-api';
import { useActiveComponentApi } from './useActiveComponentApi';

export type DocumentationNoteHtml = Partial<
  Record<
    ExampleFramework,
    Partial<Record<'devx' | 'a11y' | 'limitations', string>>
  >
>;

const NOTE_META = {
  devx: { title: 'Developer experience', tone: 'bg-surface-container' },
  a11y: { title: 'Accessibility', tone: 'bg-surface-container' },
  limitations: { title: 'Known limitations', tone: 'theme-warning' },
} as const;

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

  if (visibleNotes.length === 0) return null;

  return (
    <aside className="my-12 grid gap-4 lg:grid-cols-3" aria-label="API notes">
      {visibleNotes.map((key) => (
        <section key={key} className={`rounded-3xl p-6 ${NOTE_META[key].tone}`}>
          <h2 className="mb-3 text-title-medium">{NOTE_META[key].title}</h2>
          <div
            className="prose-markdown text-sm leading-6 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: notes[key] ?? '' }}
          />
        </section>
      ))}
    </aside>
  );
}
