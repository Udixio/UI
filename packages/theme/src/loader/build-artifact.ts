import { existsSync } from 'node:fs';
import type { ConfigInterface } from '../config';
import type { ThemeBuildArtifact } from '../plugin';

/**
 * Return the artifacts declared by the configured theme plugins.
 *
 * This deliberately stays structural: the theme package does not depend on
 * a concrete emitter such as Tailwind.
 */
export function getThemeBuildArtifacts(
  config: ConfigInterface,
): readonly ThemeBuildArtifact[] {
  return (
    config.plugins?.flatMap((plugin) => plugin.getBuildArtifacts?.() ?? []) ??
    []
  );
}

/**
 * An existing artifact is safe to use as a stale-while-revalidate fallback.
 * The owning plugin will refresh it in the background before the next theme
 * update is applied.
 */
export function hasCachedThemeBuildArtifacts(config: ConfigInterface): boolean {
  const artifacts = getThemeBuildArtifacts(config);
  return (
    artifacts.length > 0 &&
    artifacts.every((artifact) => existsSync(artifact.path))
  );
}
