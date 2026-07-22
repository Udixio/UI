import type { ExampleFramework } from '@/stores/exampleFrameworkStore';
import type { ComponentApiData } from '@/types/component-api';

const FRAMEWORK_ORDER: readonly ExampleFramework[] = ['react', 'angular'];

export function getAvailableApiFrameworks(
  api: ComponentApiData,
): ExampleFramework[] {
  return FRAMEWORK_ORDER.filter((framework) => !!api.frameworks[framework]);
}
