/*
  Snapshot script to bundle docs, theme, and components index into the npm package.
  This allows @udixio/mcp to run without cloning the monorepo.
*/
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '../..');

const DOC_SRC = path.join(REPO_ROOT, 'apps/doc/src');
const THEME_TS = path.join(REPO_ROOT, 'apps/doc/theme.config.ts');
const THEME_JSON = path.join(REPO_ROOT, 'apps/doc/theme.config.json');
const UI_SRC = path.join(REPO_ROOT, 'packages/ui-react/src');

// Targets for bundled assets
const DIST_BUNDLED = path.join(PKG_ROOT, 'dist/bundled');
const SRC_BUNDLED = path.join(PKG_ROOT, 'src/bundled');

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function writeJSON(file: string, data: unknown) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

async function copyFilePreserve(src: string, destRoot: string, base: string) {
  const rel = path.relative(base, src);
  const dest = path.join(destRoot, rel);
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

// Recursive file finder using native fs
async function findFiles(dir: string, extensions: string[]): Promise<string[]> {
  const results: string[] = [];

  async function walk(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            results.push(fullPath);
          }
        }
      }
    } catch {
      // Ignore directories that can't be read
    }
  }

  await walk(dir);
  return results;
}

async function snapshotDocs() {
  const files = await findFiles(DOC_SRC, ['.md', '.mdx', '.astro']);
  const targetDocDist = path.join(DIST_BUNDLED, 'doc-src');
  const targetDocSrc = path.join(SRC_BUNDLED, 'doc-src');
  await Promise.all([ensureDir(targetDocDist), ensureDir(targetDocSrc)]);

  for (const file of files) {
    await Promise.all([
      copyFilePreserve(file, targetDocDist, DOC_SRC),
      copyFilePreserve(file, targetDocSrc, DOC_SRC),
    ]);
  }
  console.log(`[snapshot] Docs: ${files.length} files copied`);
}

interface ThemeSnapshot {
  config: {
    sourceColor: string;
    contrastLevel: number;
    isDark: boolean;
    variant: string;
  };
  palettes: Record<string, { hue: number; chroma: number }>;
  colors: {
    light: Record<string, { hex: string; tone: number }>;
    dark: Record<string, { hex: string; tone: number }>;
  };
  customPalettes: string[];
}

async function snapshotTheme(): Promise<void> {
  let configModule: { default?: unknown } | null = null;

  // Try to import the theme config
  try {
    configModule = await import(pathToFileURL(THEME_TS).href);
  } catch {
    // Try JSON fallback
    try {
      const raw = await fs.readFile(THEME_JSON, 'utf8');
      configModule = { default: JSON.parse(raw) };
    } catch {
      // No config found
    }
  }

  if (!configModule?.default) {
    const fallback = { error: 'theme.config not found at build time' };
    await writeJSON(path.join(DIST_BUNDLED, 'theme.json'), fallback);
    await writeJSON(path.join(SRC_BUNDLED, 'theme.json'), fallback);
    console.log('[snapshot] Theme: config not found, using fallback');
    return;
  }

  const config = configModule.default as {
    sourceColor: string | ((context: unknown) => string | unknown);
    contrastLevel?: number;
    isDark?: boolean;
    variant?: { name: string };
    palettes?: Record<string, string>;
  };

  // Use the @udixio/theme loader to generate complete tokens
  try {
    const { loader } = await import('@udixio/theme');
    const { hexFromArgb } = await import('@material/material-color-utilities');

    // Generate light mode colors
    const apiLight = await loader(
      { ...config, isDark: false, contrastLevel: config.contrastLevel ?? 0 },
      false,
    );

    // Generate dark mode colors
    const apiDark = await loader(
      { ...config, isDark: true, contrastLevel: config.contrastLevel ?? 0 },
      false,
    );

    // Extract colors - getAll() returns a Map, not an object
    const extractColors = (
      api: typeof apiLight,
    ): Record<string, { hex: string; tone: number }> => {
      const colors: Record<string, { hex: string; tone: number }> = {};
      const allColors = api.colors.getAll();
      // Handle both Map and plain object
      const entries =
        allColors instanceof Map
          ? allColors.entries()
          : Object.entries(allColors);
      for (const [name, color] of entries) {
        colors[name] = {
          hex: color.getHex(),
          tone: color.getTone(),
        };
      }
      return colors;
    };

    // Extract palettes - getAll() may return a Map or object
    const extractPalettes = (
      api: typeof apiLight,
    ): Record<string, { hue: number; chroma: number }> => {
      const palettes: Record<string, { hue: number; chroma: number }> = {};
      const allPalettes = api.palettes.getAll();
      const entries =
        allPalettes instanceof Map
          ? allPalettes.entries()
          : Object.entries(allPalettes);
      for (const [name, palette] of entries) {
        palettes[name] = {
          hue: palette.hue,
          chroma: palette.chroma,
        };
      }
      return palettes;
    };

    const snapshot: ThemeSnapshot = {
      config: {
        sourceColor: hexFromArgb(apiLight.context.sourceColor.toInt()),
        contrastLevel: config.contrastLevel ?? 0,
        isDark: config.isDark ?? false,
        variant: config.variant?.name ?? 'tonal-spot',
      },
      palettes: extractPalettes(apiLight),
      colors: {
        light: extractColors(apiLight),
        dark: extractColors(apiDark),
      },
      customPalettes: config.palettes ? Object.keys(config.palettes) : [],
    };

    await writeJSON(path.join(DIST_BUNDLED, 'theme.json'), snapshot);
    await writeJSON(path.join(SRC_BUNDLED, 'theme.json'), snapshot);
    console.log(
      `[snapshot] Theme: ${Object.keys(snapshot.colors.light).length} colors, ${Object.keys(snapshot.palettes).length} palettes`,
    );
  } catch (e) {
    console.warn(
      '[snapshot] Failed to load @udixio/theme, using raw config:',
      e,
    );
    // Fallback to raw config export
    const fallback = {
      config: {
        sourceColor: typeof config.sourceColor === 'string' ? config.sourceColor : 'unknown',
        contrastLevel: config.contrastLevel ?? 0,
        isDark: config.isDark ?? false,
        variant: 'unknown',
      },
      palettes: {},
      colors: { light: {}, dark: {} },
      customPalettes: config.palettes ? Object.keys(config.palettes) : [],
    };
    await writeJSON(path.join(DIST_BUNDLED, 'theme.json'), fallback);
    await writeJSON(path.join(SRC_BUNDLED, 'theme.json'), fallback);
  }
}

async function snapshotComponents() {
  const files = await findFiles(UI_SRC, ['.tsx', '.ts']);
  const components: { name: string; file: string }[] = [];

  for (const file of files) {
    const src = await fs.readFile(file, 'utf8');
    const re = /export\s+(?:const|function|class)\s+([A-Z][A-Za-z0-9_]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      components.push({ name: m[1], file: path.relative(UI_SRC, file) });
    }
  }

  const index = { count: components.length, components };
  await writeJSON(path.join(DIST_BUNDLED, 'components-index.json'), index);
  await writeJSON(path.join(SRC_BUNDLED, 'components-index.json'), index);
  console.log(`[snapshot] Components: ${components.length} exports found`);
}

async function main() {
  console.log('[snapshot] Bundling docs, theme, and components index...');
  await ensureDir(DIST_BUNDLED);
  await ensureDir(SRC_BUNDLED);
  await snapshotDocs();
  await snapshotTheme();
  await snapshotComponents();
  console.log('[snapshot] Done.');
}

main().catch((e) => {
  console.error('[snapshot] failed:', e);
  process.exit(1);
});
