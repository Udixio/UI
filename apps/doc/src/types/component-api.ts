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
}

export interface AngularContentSlot {
  name: string;
  selector: string;
  description: string;
}

export interface ReactComponentApi {
  filePath: string;
  description: string;
  tags: ComponentTags;
  methods: unknown[];
  props: Record<string, ApiMember>;
}

export interface AngularComponentApi {
  filePath: string;
  description: string;
  tags: ComponentTags;
  inputs: Record<string, ApiMember>;
  outputs: Record<string, ApiMember>;
  content?: Record<string, AngularContentSlot>;
}

export interface ComponentApiData {
  schemaVersion: 2;
  displayName: string;
  defaultFramework: 'react';
  frameworks: {
    react: ReactComponentApi;
    angular?: AngularComponentApi;
  };
}

export type ComponentFrameworkApi = ReactComponentApi | AngularComponentApi;

export interface ComponentSidebarItem {
  slug: string;
  displayName: string;
  description: string;
  tags: ComponentTags;
}
