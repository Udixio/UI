import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Stats } from 'node:fs';
import type { ThemeSnapshot } from './loaders/theme';

// Mock data
const mockComponentsIndex = {
  count: 2,
  components: [
    { name: 'Button', file: 'components/Button.tsx' },
    { name: 'Card', file: 'components/Card.tsx' },
  ],
};

const mockThemeSnapshot: ThemeSnapshot = {
  config: {
    sourceColor: '#6750A4',
    contrastLevel: 0,
    isDark: false,
    variant: 'TONAL_SPOT',
  },
  palettes: {
    primary: { hue: 271.6, chroma: 56.2 },
    secondary: { hue: 271.6, chroma: 16.0 },
    tertiary: { hue: 331.6, chroma: 32.0 },
    neutral: { hue: 271.6, chroma: 4.0 },
    error: { hue: 25.0, chroma: 84.0 },
  },
  colors: {
    light: {
      primary: { hex: '#6750A4', tone: 40 },
      surface: { hex: '#FFFBFE', tone: 99 },
    },
    dark: {
      primary: { hex: '#D0BCFF', tone: 80 },
      surface: { hex: '#1C1B1F', tone: 6 },
    },
  },
  customPalettes: [],
};

const mockDocContent = `---
title: Getting Started
---

# Getting Started

Welcome to the component library.
`;

// Mock fs module
vi.mock('node:fs/promises', () => ({
  default: {
    stat: vi.fn(),
    readFile: vi.fn(),
  },
}));

// Mock globby
vi.mock('globby', () => ({
  globby: vi.fn(),
}));

// Mock gray-matter
vi.mock('gray-matter', () => ({
  default: vi.fn((text: string) => {
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (match) {
      const frontmatter = match[1];
      const content = match[2];
      const data: Record<string, string> = {};
      frontmatter.split('\n').forEach((line) => {
        const [key, value] = line.split(':').map((s) => s.trim());
        if (key && value) {
          data[key] = value;
        }
      });
      return { content, data };
    }
    return { content: text, data: {} };
  }),
}));

import fs from 'node:fs/promises';
import { globby } from 'globby';
import { loadComponentsIndex, loadComponentDoc } from './loaders/components';
import { searchDocs, getDocByPath } from './loaders/docs';
import { loadThemeTokens } from './loaders/theme';

describe('@udixio/mcp loaders (mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.stat).mockResolvedValue({} as Stats);
  });

  it('loadComponentsIndex returns components index', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify(mockComponentsIndex),
    );

    const idx = await loadComponentsIndex();

    expect(idx).toBeTruthy();
    expect(Array.isArray(idx.components)).toBe(true);
    expect(idx.count).toBeGreaterThan(0);
    const names = idx.components.map((c: { name: string }) => c.name);
    expect(names).toEqual(expect.arrayContaining(['Button', 'Card']));
  });

  it('loadComponentDoc finds docs matching component name', async () => {
    vi.mocked(globby).mockResolvedValue([
      '/path/to/docs/Getting-Started.mdx',
    ]);

    const res = await loadComponentDoc('Getting-Started');

    expect(res).toHaveProperty('name');
    expect(res).toHaveProperty('docs');
    expect(Array.isArray(res.docs)).toBe(true);
  });

  it('searchDocs returns results for a known term', async () => {
    vi.mocked(globby).mockResolvedValue(['/path/to/docs/getting-started.mdx']);
    vi.mocked(fs.readFile).mockResolvedValue(mockDocContent);

    const results = await searchDocs('Started', 5);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    const files = results.map((r: { file: string }) => r.file);
    expect(files.join('\n')).toMatch(/getting-started\.mdx/);
  });

  it('getDocByPath reads a doc file', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(mockDocContent);

    const file = await getDocByPath('getting-started.mdx');

    expect(file.mimeType).toBe('text/markdown');
    expect(file.content).toMatch(/# Getting Started/);
  });

  it('loadThemeTokens returns theme object', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify(mockThemeSnapshot),
    );

    const theme = await loadThemeTokens();

    expect(theme).toBeTruthy();
    expect(theme.colors.light.primary.hex).toBe('#6750A4');
  });
});
