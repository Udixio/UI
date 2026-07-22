import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  initializeExampleFrameworkPreference,
  preferredExampleFrameworkStore,
  resolveExampleFramework,
  type ExampleFramework,
} from '@/stores/exampleFrameworkStore';
import { getAvailableApiFrameworks } from '@/lib/componentApi';
import type {
  ComponentApiData,
  ComponentFrameworkApi,
} from '@/types/component-api';

export function useActiveComponentApi(api: ComponentApiData): {
  activeFramework: ExampleFramework;
  activeApi: ComponentFrameworkApi;
  availableFrameworks: ExampleFramework[];
} {
  const preferredFramework = useStore(preferredExampleFrameworkStore);
  const availableFrameworks = getAvailableApiFrameworks(api);
  const activeFramework =
    resolveExampleFramework(preferredFramework, availableFrameworks) ??
    api.defaultFramework;
  const activeApi = api.frameworks[activeFramework];

  useEffect(() => {
    initializeExampleFrameworkPreference();
  }, []);

  if (!activeApi) {
    throw new Error(
      `Missing API data for the resolved framework "${activeFramework}".`,
    );
  }

  return { activeFramework, activeApi, availableFrameworks };
}
