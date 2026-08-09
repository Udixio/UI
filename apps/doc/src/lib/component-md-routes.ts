import type { CollectionEntry } from 'astro:content';
import type { ExampleFramework } from '@/stores/exampleFrameworkStore';

type ApiData = CollectionEntry<'api'>['data'];

export type FrameworkVariant = {
  /** Appended to the document name, e.g. `.angular` in `overview.angular.md`. */
  suffix: string;
  frameworks: readonly ExampleFramework[];
};

/** The frameworks a component actually ships; React is the guaranteed one. */
export function availableFrameworks(api: ApiData): ExampleFramework[] {
  return api.frameworks.angular ? ['react', 'angular'] : ['react'];
}

/**
 * The `.md` flavours generated for every markdown document: an unsuffixed one
 * covering every framework the component ships — mirroring the HTML page, whose
 * framework switch is a client-side preference rather than a URL — plus one
 * narrowed variant per framework for agents that only write one of them.
 */
export function frameworkVariants(api: ApiData): FrameworkVariant[] {
  const available = availableFrameworks(api);

  return [
    { suffix: '', frameworks: available },
    ...available.map((framework) => ({
      suffix: `.${framework}`,
      frameworks: [framework] as const,
    })),
  ];
}

/**
 * Mirrors the slug derivation in `components/[component]/overview.astro`: the
 * glob loader strips the dot from `button.overview.mdx`, so an overview entry's
 * id is the component name with the literal substring "overview" appended.
 */
export function findOverview(
  overviews: CollectionEntry<'overviews'>[],
  component: string,
): CollectionEntry<'overviews'> | undefined {
  return overviews.find((entry) => entry.id.replace('overview', '') === component);
}
