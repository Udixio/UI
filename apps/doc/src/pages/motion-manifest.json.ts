import manifest from '@udixio/motion/motion-manifest.json';

// The generated manifest of @udixio/motion, served as it is published with the package.
export const prerender = true;

export function GET() {
  return new Response(`${JSON.stringify(manifest, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
