import { describe, it, expect, beforeAll, vi } from 'vitest';
import type {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ThemeSnapshot } from './loaders/theme';

// Mock data
const mockComponentsIndex = {
  count: 3,
  components: [
    { name: 'Button', file: 'components/Button.tsx' },
    { name: 'Card', file: 'components/Card.tsx' },
    { name: 'Dialog', file: 'components/Dialog.tsx' },
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
    neutralVariant: { hue: 271.6, chroma: 8.0 },
    error: { hue: 25.0, chroma: 84.0 },
  },
  colors: {
    light: {
      primary: { hex: '#6750A4', tone: 40 },
      onPrimary: { hex: '#FFFFFF', tone: 100 },
      surface: { hex: '#FFFBFE', tone: 99 },
      onSurface: { hex: '#1C1B1F', tone: 10 },
    },
    dark: {
      primary: { hex: '#D0BCFF', tone: 80 },
      onPrimary: { hex: '#381E72', tone: 20 },
      surface: { hex: '#1C1B1F', tone: 6 },
      onSurface: { hex: '#E6E1E5', tone: 90 },
    },
  },
  customPalettes: [],
};

const mockDocContent = `---
title: Button Component
---

# Button

The Button component for user interactions.
`;

// Mock loaders
vi.mock('./loaders/components', () => ({
  loadComponentsIndex: vi.fn(),
  loadComponentDoc: vi.fn(),
}));

vi.mock('./loaders/docs', () => ({
  searchDocs: vi.fn(),
  getDocByPath: vi.fn(),
}));

vi.mock('./loaders/theme', () => ({
  loadThemeTokens: vi.fn(),
  getColor: vi.fn(),
  listColors: vi.fn(),
  listPalettes: vi.fn(),
  getThemeConfig: vi.fn(),
}));

import { loadComponentsIndex, loadComponentDoc } from './loaders/components';
import { searchDocs, getDocByPath } from './loaders/docs';
import {
  loadThemeTokens,
  getColor,
  listColors,
  listPalettes,
  getThemeConfig,
} from './loaders/theme';
import { registerToolsAndResources } from './mcp';

// Minimal mock implementations to capture tool/resource handlers
type ToolHandler = (
  input: Record<string, unknown>,
) => Promise<{ content: { type: 'text'; text: string }[] }>;

type ResourceHandler = (
  uri: URL,
  params: Record<string, unknown>,
) => Promise<{ contents: { uri: string; mimeType?: string; text: string }[] }>;

class TestServer implements Partial<McpServer> {
  public tools = new Map<string, { config: unknown; handler: ToolHandler }>();
  public resources = new Map<
    string,
    { template: ResourceTemplate; meta: unknown; handler: ResourceHandler }
  >();

  registerTool(name: string, config: unknown, handler: ToolHandler) {
    this.tools.set(name, { config, handler });
    return this as unknown;
  }

  registerResource(
    name: string,
    template: ResourceTemplate,
    meta: unknown,
    handler: ResourceHandler,
  ) {
    this.resources.set(name, { template, meta, handler });
    return this as unknown;
  }
}

function parseFirstText(result: {
  content: { type: 'text'; text: string }[];
}): string {
  const first = result.content[0];
  return first?.text ?? '';
}

function parseJSON<T = unknown>(text: string): T {
  return JSON.parse(text) as T;
}

describe('MCP registered tools/resources', () => {
  let server: TestServer;

  beforeAll(() => {
    // Setup mocks with default values
    vi.mocked(loadComponentsIndex).mockResolvedValue(mockComponentsIndex);
    vi.mocked(loadComponentDoc).mockImplementation(async (name: string) => ({
      name,
      docs: [`${name}.mdx`, `${name}.stories.tsx`],
    }));
    vi.mocked(searchDocs).mockResolvedValue([
      { file: 'button.mdx', score: 5, title: 'Button', snippet: 'Button...' },
    ]);
    vi.mocked(getDocByPath).mockResolvedValue({
      mimeType: 'text/markdown',
      content: mockDocContent,
    });
    vi.mocked(loadThemeTokens).mockResolvedValue(mockThemeSnapshot);
    vi.mocked(getThemeConfig).mockResolvedValue(mockThemeSnapshot.config);
    vi.mocked(listColors).mockImplementation(async (mode = 'light') => {
      const colors =
        mode === 'dark'
          ? mockThemeSnapshot.colors.dark
          : mockThemeSnapshot.colors.light;
      return Object.keys(colors);
    });
    vi.mocked(getColor).mockImplementation(
      async (name: string, mode = 'light') => {
        const colors =
          mode === 'dark'
            ? mockThemeSnapshot.colors.dark
            : mockThemeSnapshot.colors.light;
        const color = colors[name as keyof typeof colors];
        if (!color) return null;
        return { name, ...color };
      },
    );
    vi.mocked(listPalettes).mockResolvedValue(
      Object.entries(mockThemeSnapshot.palettes).map(([name, palette]) => ({
        name,
        ...palette,
      })),
    );

    server = new TestServer();
    registerToolsAndResources(server as unknown as McpServer);
  });

  describe('Component Tools', () => {
    it('listComponents returns JSON with components array', async () => {
      const tool = server.tools.get('listComponents');
      expect(tool).toBeTruthy();

      const res = await tool!.handler({});
      const text = parseFirstText(res);
      const data = parseJSON<{ count: number; components: unknown[] }>(text);

      expect(data.components).toBeDefined();
      expect(Array.isArray(data.components)).toBe(true);
      expect(data.count).toBe(data.components.length);
    });

    it('getComponentDoc returns doc info for a component', async () => {
      const tool = server.tools.get('getComponentDoc');
      expect(tool).toBeTruthy();

      const res = await tool!.handler({ name: 'Button' });
      const text = parseFirstText(res);
      const data = parseJSON<{ name: string; docs: string[] }>(text);

      expect(data.name).toBe('Button');
      expect(Array.isArray(data.docs)).toBe(true);
    });
  });

  describe('Docs Tools', () => {
    it('searchDocs returns results for a query', async () => {
      const tool = server.tools.get('searchDocs');
      expect(tool).toBeTruthy();

      const res = await tool!.handler({ query: 'button', limit: 5 });
      const text = parseFirstText(res);
      const data = parseJSON<unknown[]>(text);

      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Theme Tools', () => {
    it('getThemeTokens returns complete theme structure', async () => {
      const tool = server.tools.get('getThemeTokens');
      expect(tool).toBeTruthy();

      const res = await tool!.handler({});
      const text = parseFirstText(res);
      const data = parseJSON<{
        config: unknown;
        palettes: unknown;
        colors: { light: unknown; dark: unknown };
      }>(text);

      expect(data.config).toBeDefined();
      expect(data.palettes).toBeDefined();
      expect(data.colors).toBeDefined();
      expect(data.colors.light).toBeDefined();
      expect(data.colors.dark).toBeDefined();
    });

    it('getThemeConfig returns theme configuration', async () => {
      const tool = server.tools.get('getThemeConfig');
      expect(tool).toBeTruthy();

      const res = await tool!.handler({});
      const text = parseFirstText(res);
      const data = parseJSON<{
        sourceColor: string;
        contrastLevel: number;
        isDark: boolean;
        variant: string;
      }>(text);

      expect(data.sourceColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof data.contrastLevel).toBe('number');
      expect(typeof data.isDark).toBe('boolean');
      expect(typeof data.variant).toBe('string');
    });

    it('listColors returns array of color names', async () => {
      const tool = server.tools.get('listColors');
      expect(tool).toBeTruthy();

      const res = await tool!.handler({ mode: 'light' });
      const text = parseFirstText(res);
      const data = parseJSON<string[]>(text);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data).toContain('primary');
    });

    it('listColors works for dark mode', async () => {
      const tool = server.tools.get('listColors');
      expect(tool).toBeTruthy();

      const res = await tool!.handler({ mode: 'dark' });
      const text = parseFirstText(res);
      const data = parseJSON<string[]>(text);

      expect(Array.isArray(data)).toBe(true);
      expect(data).toContain('primary');
    });

    it('getColor returns color details', async () => {
      const tool = server.tools.get('getColor');
      expect(tool).toBeTruthy();

      const res = await tool!.handler({ name: 'primary', mode: 'light' });
      const text = parseFirstText(res);
      const data = parseJSON<{ name: string; hex: string; tone: number }>(text);

      expect(data.name).toBe('primary');
      expect(data.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof data.tone).toBe('number');
    });

    it('getColor returns error for non-existent color', async () => {
      const tool = server.tools.get('getColor');
      expect(tool).toBeTruthy();

      const res = await tool!.handler({
        name: 'nonExistentColor',
        mode: 'light',
      });
      const text = parseFirstText(res);
      const data = parseJSON<{ error: string }>(text);

      expect(data.error).toContain('not found');
    });

    it('listPalettes returns array of palettes', async () => {
      const tool = server.tools.get('listPalettes');
      expect(tool).toBeTruthy();

      const res = await tool!.handler({});
      const text = parseFirstText(res);
      const data = parseJSON<{ name: string; hue: number; chroma: number }[]>(
        text,
      );

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const primary = data.find((p) => p.name === 'primary');
      expect(primary).toBeDefined();
      expect(typeof primary?.hue).toBe('number');
      expect(typeof primary?.chroma).toBe('number');
    });

    it('compareColor returns light and dark values', async () => {
      const tool = server.tools.get('compareColor');
      expect(tool).toBeTruthy();

      const res = await tool!.handler({ name: 'primary' });
      const text = parseFirstText(res);
      const data = parseJSON<{
        name: string;
        light: { hex: string; tone: number };
        dark: { hex: string; tone: number };
      }>(text);

      expect(data.name).toBe('primary');
      expect(data.light).toBeDefined();
      expect(data.dark).toBeDefined();
      expect(data.light.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(data.dark.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('compareColor returns error for non-existent color', async () => {
      const tool = server.tools.get('compareColor');
      expect(tool).toBeTruthy();

      const res = await tool!.handler({ name: 'nonExistentColor' });
      const text = parseFirstText(res);
      const data = parseJSON<{ error: string }>(text);

      expect(data.error).toContain('not found');
    });
  });

  describe('Resources', () => {
    it('theme resource returns complete tokens', async () => {
      const resEntry = server.resources.get('theme');
      expect(resEntry).toBeTruthy();

      const url = new URL('theme://tokens');
      const res = await resEntry!.handler(url, {});
      const item = res.contents[0];

      expect(item.uri).toBe(url.href);
      expect(item.mimeType).toBe('application/json');

      const data = parseJSON<{ config: unknown; colors: unknown }>(item.text);
      expect(data.config).toBeDefined();
      expect(data.colors).toBeDefined();
    });

    it('doc resource returns doc content', async () => {
      const resEntry = server.resources.get('doc');
      expect(resEntry).toBeTruthy();

      const url = new URL('doc://button.mdx');
      const res = await resEntry!.handler(url, { path: 'button.mdx' });
      const item = res.contents[0];

      expect(item.uri).toBe(url.href);
      expect(item.mimeType).toBe('text/markdown');
      expect(item.text).toContain('Button');
    });
  });

  describe('Tool Registration', () => {
    it('should register all expected tools', () => {
      const expectedTools = [
        'listComponents',
        'getComponentDoc',
        'searchDocs',
        'getThemeTokens',
        'getThemeConfig',
        'listColors',
        'getColor',
        'listPalettes',
        'compareColor',
      ];

      for (const toolName of expectedTools) {
        expect(server.tools.has(toolName)).toBe(true);
      }
    });

    it('should register all expected resources', () => {
      const expectedResources = ['doc', 'theme'];

      for (const resourceName of expectedResources) {
        expect(server.resources.has(resourceName)).toBe(true);
      }
    });
  });
});
