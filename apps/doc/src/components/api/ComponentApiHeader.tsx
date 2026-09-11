import type { ComponentApiData } from '@/types/component-api';

export function ComponentApiHeader({ api }: { api: ComponentApiData }) {
  // The description is the same whichever framework is selected: it describes
  // the concept, which the shared contract owns.
  return (
    <>
      <h1 className="text-display-large">{api.displayName}</h1>
      {api.description && (
        <p className="mt-8 text-headline-small">{api.description}</p>
      )}
    </>
  );
}
