export interface ComponentTags {
  status?: string;
  category?: string;
  devx?: string;
  a11y?: string;
  limitations?: string;
}

export interface PropDeclaration {
  fileName: string;
  name: string;
}

export interface PropType {
  name: string;
}

export interface PropDefaultValue {
  value: string | boolean | number;
}

export interface ComponentProp {
  defaultValue: PropDefaultValue | null;
  description: string;
  name: string;
  declarations: PropDeclaration[];
  required: boolean;
  type: PropType;
}

export interface ComponentApiData {
  tags: ComponentTags;
  filePath: string;
  description: string;
  displayName: string;
  methods: unknown[];
  props: Record<string, ComponentProp>;
}

export interface ComponentSidebarItem {
  slug: string;
  displayName: string;
  description: string;
  tags: ComponentTags;
}
