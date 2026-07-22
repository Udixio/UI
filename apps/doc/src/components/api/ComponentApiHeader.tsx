import type { ComponentApiData } from '@/types/component-api';
import { useActiveComponentApi } from './useActiveComponentApi';

export function ComponentApiHeader({ api }: { api: ComponentApiData }) {
  const { activeApi } = useActiveComponentApi(api);

  return (
    <>
      <h1 className="text-display-large">{api.displayName}</h1>
      {activeApi.description && (
        <p className="mt-8 text-headline-small">{activeApi.description}</p>
      )}
    </>
  );
}
