// The address of a motion page, as the doc tests write it: a test never spells a motion path by hand (framework-urls spec §2.8).
import { withFramework } from '../src/lib/framework-url.ts';
import { MOTION_NEEDS } from '../src/lib/motion-nav.ts';

/**
 * The address of a motion page in `framework` (React by default). A neutral page has its bare address; a feature without
 * `tab` gets its default tab.
 */
export function motionUrl(slug, framework = 'react', tab) {
  const page = MOTION_NEEDS.find((candidate) => candidate.slug === slug);
  if (page === undefined)
    throw new Error(`motionUrl: "${slug}" is not a page of MOTION_NEEDS`);
  return withFramework(
    tab === undefined ? page.href : `${page.href}/${tab}`,
    framework,
  );
}
