import {
  motionManifest,
  type ManifestReduced,
  type ManifestVerb,
} from './manifest.js';

/** Internal decision only: consumers must apply the selected rendering themselves. */
export function resolveReducedRender(
  verb: ManifestVerb,
  override?: ManifestReduced,
): { render: ManifestReduced; scalesWithMotion: boolean } {
  if (
    typeof verb !== 'string' ||
    !(motionManifest.domains.verbs as readonly string[]).includes(verb)
  ) {
    throw new TypeError('Invalid motion verb');
  }
  if (
    override !== undefined &&
    (typeof override !== 'string' ||
      !(motionManifest.domains.reduced as readonly string[]).includes(override))
  ) {
    throw new TypeError('Invalid reduced render');
  }
  const render = override ?? motionManifest.defaults[verb].reduced;
  return {
    render,
    scalesWithMotion: render !== 'fade',
  };
}
