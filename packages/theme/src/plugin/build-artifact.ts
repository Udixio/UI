/**
 * A file produced by a theme plugin during a build.
 *
 * The theme package only knows the contract. The plugin that owns the file
 * decides where it lives and how it is generated.
 */
export interface ThemeBuildArtifact {
  readonly kind: string;
  readonly path: string;
}
