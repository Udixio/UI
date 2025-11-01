import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.env.UDIXIO_ROOT || process.cwd();
const UI_ROOT =
  process.env.UDIXIO_UI_ROOT || path.join(ROOT, 'packages/ui-react/src');

export async function loadComponentsIndex() {
  const files = await globby(['**/*.{tsx,ts}'], {
    cwd: UI_ROOT,
    absolute: true,
  });
  const components: { name: string; file: string }[] = [];
  for (const file of files) {
    const src = await fs.readFile(file, 'utf8');
    const re = /export\s+(?:const|function|class)\s+([A-Z][A-Za-z0-9_]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      components.push({ name: m[1], file: path.relative(UI_ROOT, file) });
    }
  }
  return { count: components.length, components };
}

export async function loadComponentDoc(name: string) {
  // Heuristique: chercher un fichier MD/MDX/Story/Examples correspondant
  const DOC_ROOT = process.env.UDIXIO_DOC_ROOT || path.join(ROOT, 'apps/doc');
  const patterns = [
    `**/${name}.md*`,
    `**/${name.toLowerCase()}.md*`,
    `**/${name}.stories.@(mdx|tsx)`,
  ];
  const matches = await globby(patterns, { cwd: DOC_ROOT, absolute: true });
  return {
    name,
    docs: matches.map((m) => path.relative(DOC_ROOT, m)),
  };
}