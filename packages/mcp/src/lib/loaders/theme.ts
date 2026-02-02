import path from 'node:path';
import fs from 'node:fs/promises';

function hereDir() {
  return __dirname;
}

function bundledThemePath() {
  const candidates = [
    path.resolve(hereDir(), './bundled/theme.json'),
    path.resolve(hereDir(), '../bundled/theme.json'),
  ];
  return candidates[0];
}

async function pathExists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

export interface ThemeSnapshot {
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

export async function loadThemeTokens(): Promise<ThemeSnapshot> {
  const bundled = bundledThemePath();
  if (await pathExists(bundled)) {
    const raw = await fs.readFile(bundled, 'utf8');
    return JSON.parse(raw) as ThemeSnapshot;
  }
  throw new Error('Bundled theme.json not found.');
}

export async function getColor(
  name: string,
  mode: 'light' | 'dark' = 'light',
): Promise<{ name: string; hex: string; tone: number } | null> {
  const tokens = await loadThemeTokens();
  const colors = mode === 'dark' ? tokens.colors.dark : tokens.colors.light;
  const color = colors[name];
  if (!color) return null;
  return { name, ...color };
}

export async function listColors(
  mode: 'light' | 'dark' = 'light',
): Promise<string[]> {
  const tokens = await loadThemeTokens();
  const colors = mode === 'dark' ? tokens.colors.dark : tokens.colors.light;
  return Object.keys(colors);
}

export async function listPalettes(): Promise<
  Array<{ name: string; hue: number; chroma: number }>
> {
  const tokens = await loadThemeTokens();
  return Object.entries(tokens.palettes).map(([name, palette]) => ({
    name,
    ...palette,
  }));
}

export async function getThemeConfig(): Promise<ThemeSnapshot['config']> {
  const tokens = await loadThemeTokens();
  return tokens.config;
}
