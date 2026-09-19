export interface ComponentTags {
  status?: string;
  category?: string;
  parent?: string;
  devx?: string;
  a11y?: string;
  limitations?: string;
}

export interface ApiType {
  name: string;
}

export interface ApiDefaultValue {
  value: string;
}

export interface ApiMember {
  defaultValue: ApiDefaultValue | null;
  description: string;
  name: string;
  required: boolean;
  type: ApiType;
  alias?: string;
  /** Svelte only: the prop is `$bindable`, so `bind:` works on it. */
  bindable?: true;
}

export interface SvelteSnippet {
  name: string;
  description: string;
  /** Tuple type of the snippet parameters, when it takes any. */
  parameters?: string;
}

export interface AngularContentSlot {
  name: string;
  selector: string;
  description: string;
}

export interface ReactComponentApi {
  filePath: string;
  tags: ComponentTags;
  methods: unknown[];
  props: Record<string, ApiMember>;
}

export interface AngularComponentApi {
  filePath: string;
  /** Where the members below attach: `udx-tooltip`, or `[udxTooltip]`. */
  selector: string;
  tags: ComponentTags;
  inputs: Record<string, ApiMember>;
  outputs: Record<string, ApiMember>;
  content?: Record<string, AngularContentSlot>;
}

export interface SvelteComponentApi {
  filePath: string;
  /** Exported attachment function, when the adapter is `{@attach}`ed rather than rendered. */
  attachment?: string;
  tags: ComponentTags;
  props: Record<string, ApiMember>;
  snippets?: Record<string, SvelteSnippet>;
}

export interface ComponentApiData {
  schemaVersion: 5;
  displayName: string;
  /** The one description, read from the shared contract. */
  description: string;
  defaultFramework: 'react';
  frameworks: {
    react: ReactComponentApi;
    angular?: AngularComponentApi;
    svelte?: SvelteComponentApi;
  };
}

export type ComponentFrameworkApi =
  | ReactComponentApi
  | AngularComponentApi
  | SvelteComponentApi;

export interface ComponentSidebarItem {
  slug: string;
  displayName: string;
  description: string;
  tags: ComponentTags;
}
