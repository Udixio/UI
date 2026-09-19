import { EXAMPLE_FRAMEWORKS, type ExampleFramework } from '@/stores/exampleFrameworkStore';
import type { ComponentApiData } from '@/types/component-api';

export function getAvailableApiFrameworks(
  api: ComponentApiData,
): ExampleFramework[] {
  return EXAMPLE_FRAMEWORKS.filter((framework) => !!api.frameworks[framework]);
}
