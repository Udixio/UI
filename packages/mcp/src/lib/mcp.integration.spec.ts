/**
 * Integration tests simulating a real AI client communicating with the MCP server
 * via the MCP protocol (initialize → list tools → call tools → read resources).
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { ThemeSnapshot } from './loaders/theme';

// ── Mock data ──────────────────────────────────────────────

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
    error: { hue: 25.0, chroma: 84.0 },
  },
  colors: {
    light: {
      primary: { hex: '#6750A4', tone: 40 },
      onPrimary: { hex: '#FFFFFF', tone: 100 },
      surface: { hex: '#FFFBFE', tone: 99 },
    },
    dark: {
      primary: { hex: '#D0BCFF', tone: 80 },
      onPrimary: { hex: '#381E72', tone: 20 },
      surface: { hex: '#1C1B1F', tone: 6 },
    },
  },
  customPalettes: [],
};

const mockDocContent = `---
title: Button Component
---

# Button

The Button component handles user interactions.

## Props

- variant: primary | secondary
- size: sm | md | lg
`;

// ── Mock loaders (file I/O only) ───────────────────────────

vi.mock('./loaders/components', () => ({
  loadComponentsIndex: vi.fn().mockResolvedValue({
    count: 3,
    components: [
      { name: 'Button', file: 'components/Button.tsx' },
      { name: 'Card', file: 'components/Card.tsx' },
      { name: 'Dialog', file: 'components/Dialog.tsx' },
    ],
  }),
  loadComponentDoc: vi.fn().mockImplementation(async (name: string) => ({
    name,
    docs: [`${name}.mdx`],
  })),
}));

vi.mock('./loaders/docs', () => ({
  searchDocs: vi.fn().mockImplementation(async (query: string) => {
    if (query.toLowerCase().includes('button')) {
      return [
        {
          file: 'button.mdx',
          score: 5,
          title: 'Button Component',
          snippet: 'The Button component handles user interactions.',
        },
      ];
    }
    return [];
  }),
  getDocByPath: vi.fn().mockResolvedValue({
    mimeType: 'text/markdown',
    content: `---
title: Button Component
---

# Button

The Button component handles user interactions.`,
  }),
}));

vi.mock('./loaders/theme', () => {
  const snapshot: ThemeSnapshot = {
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
        onPrimary: { hex: '#FFFFFF', tone: 100 },
        surface: { hex: '#FFFBFE', tone: 99 },
      },
      dark: {
        primary: { hex: '#D0BCFF', tone: 80 },
        onPrimary: { hex: '#381E72', tone: 20 },
        surface: { hex: '#1C1B1F', tone: 6 },
      },
    },
    customPalettes: [],
  };

  return {
    loadThemeTokens: vi.fn().mockResolvedValue(snapshot),
    getThemeConfig: vi.fn().mockResolvedValue(snapshot.config),
    listColors: vi.fn().mockImplementation(async (mode = 'light') => {
      const colors =
        mode === 'dark' ? snapshot.colors.dark : snapshot.colors.light;
      return Object.keys(colors);
    }),
    getColor: vi.fn().mockImplementation(async (name: string, mode = 'light') => {
      const colors =
        mode === 'dark' ? snapshot.colors.dark : snapshot.colors.light;
      const color = colors[name as keyof typeof colors];
      if (!color) return null;
      return { name, ...color };
    }),
    listPalettes: vi.fn().mockResolvedValue(
      Object.entries(snapshot.palettes).map(([name, p]) => ({
        name,
        ...p,
      })),
    ),
  };
});

import { registerToolsAndResources } from './mcp';

// ── Test suite ─────────────────────────────────────────────

describe('MCP Integration — AI client simulation', () => {
  let client: Client;
  let server: McpServer;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeAll(async () => {
    // Create server
    server = new McpServer({
      name: '@udixio/mcp',
      version: '0.0.0-test',
    });
    registerToolsAndResources(server);

    // Create linked transport pair
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    // Create client (like Claude Desktop would)
    client = new Client(
      { name: 'claude-test-client', version: '1.0.0' },
      { capabilities: {} },
    );

    // Connect both sides — this triggers the initialize handshake
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  // ── Handshake ──────────────────────────────────────────

  describe('Protocol handshake', () => {
    it('should complete initialization and report server info', () => {
      const serverVersion = client.getServerVersion();
      expect(serverVersion).toBeDefined();
      expect(serverVersion!.name).toBe('@udixio/mcp');
    });

    it('should advertise tools and resources capabilities', () => {
      const caps = client.getServerCapabilities();
      expect(caps).toBeDefined();
      expect(caps!.tools).toBeDefined();
      expect(caps!.resources).toBeDefined();
    });
  });

  // ── Tool discovery ─────────────────────────────────────

  describe('Tool discovery (listTools)', () => {
    it('should list all registered tools', async () => {
      const { tools } = await client.listTools();

      const names = tools.map((t) => t.name);
      expect(names).toContain('listComponents');
      expect(names).toContain('getComponentDoc');
      expect(names).toContain('searchDocs');
      expect(names).toContain('getThemeTokens');
      expect(names).toContain('getThemeConfig');
      expect(names).toContain('listColors');
      expect(names).toContain('getColor');
      expect(names).toContain('listPalettes');
      expect(names).toContain('compareColor');
      expect(tools.length).toBe(9);
    });

    it('each tool should have a description and input schema', async () => {
      const { tools } = await client.listTools();

      for (const tool of tools) {
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  // ── Component tools ────────────────────────────────────

  describe('Component tools', () => {
    it('listComponents should return component list', async () => {
      const result = await client.callTool({ name: 'listComponents', arguments: {} });

      expect(result.isError).toBeFalsy();
      const text = (result.content as { type: string; text: string }[])[0].text;
      const data = JSON.parse(text);
      expect(data.count).toBe(3);
      expect(data.components).toHaveLength(3);
      expect(data.components.map((c: { name: string }) => c.name)).toContain('Button');
    });

    it('getComponentDoc should return docs for a known component', async () => {
      const result = await client.callTool({
        name: 'getComponentDoc',
        arguments: { name: 'Button' },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as { type: string; text: string }[])[0].text;
      const data = JSON.parse(text);
      expect(data.name).toBe('Button');
      expect(data.docs).toBeDefined();
    });
  });

  // ── Documentation tools ────────────────────────────────

  describe('Documentation tools', () => {
    it('searchDocs should find results for "button"', async () => {
      const result = await client.callTool({
        name: 'searchDocs',
        arguments: { query: 'button' },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as { type: string; text: string }[])[0].text;
      const data = JSON.parse(text);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].title).toBe('Button Component');
    });

    it('searchDocs should return empty for unknown query', async () => {
      const result = await client.callTool({
        name: 'searchDocs',
        arguments: { query: 'xyznonexistent' },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as { type: string; text: string }[])[0].text;
      const data = JSON.parse(text);
      expect(data).toHaveLength(0);
    });
  });

  // ── Theme tools ────────────────────────────────────────

  describe('Theme tools', () => {
    it('getThemeTokens should return full theme structure', async () => {
      const result = await client.callTool({ name: 'getThemeTokens', arguments: {} });

      expect(result.isError).toBeFalsy();
      const text = (result.content as { type: string; text: string }[])[0].text;
      const data = JSON.parse(text);
      expect(data.config).toBeDefined();
      expect(data.colors.light).toBeDefined();
      expect(data.colors.dark).toBeDefined();
      expect(data.palettes).toBeDefined();
    });

    it('getThemeConfig should return config with sourceColor', async () => {
      const result = await client.callTool({ name: 'getThemeConfig', arguments: {} });

      expect(result.isError).toBeFalsy();
      const text = (result.content as { type: string; text: string }[])[0].text;
      const data = JSON.parse(text);
      expect(data.sourceColor).toBe('#6750A4');
      expect(data.variant).toBe('TONAL_SPOT');
    });

    it('listColors should return color names for light mode', async () => {
      const result = await client.callTool({
        name: 'listColors',
        arguments: { mode: 'light' },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as { type: string; text: string }[])[0].text;
      const data = JSON.parse(text);
      expect(data).toContain('primary');
      expect(data).toContain('surface');
    });

    it('listColors should return color names for dark mode', async () => {
      const result = await client.callTool({
        name: 'listColors',
        arguments: { mode: 'dark' },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as { type: string; text: string }[])[0].text;
      const data = JSON.parse(text);
      expect(data).toContain('primary');
    });

    it('getColor should return hex and tone for a known color', async () => {
      const result = await client.callTool({
        name: 'getColor',
        arguments: { name: 'primary', mode: 'light' },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as { type: string; text: string }[])[0].text;
      const data = JSON.parse(text);
      expect(data.name).toBe('primary');
      expect(data.hex).toBe('#6750A4');
      expect(data.tone).toBe(40);
    });

    it('getColor should return error for unknown color', async () => {
      const result = await client.callTool({
        name: 'getColor',
        arguments: { name: 'nonexistent', mode: 'light' },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as { type: string; text: string }[])[0].text;
      const data = JSON.parse(text);
      expect(data.error).toContain('not found');
    });

    it('compareColor should return both light and dark values', async () => {
      const result = await client.callTool({
        name: 'compareColor',
        arguments: { name: 'primary' },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as { type: string; text: string }[])[0].text;
      const data = JSON.parse(text);
      expect(data.name).toBe('primary');
      expect(data.light.hex).toBe('#6750A4');
      expect(data.dark.hex).toBe('#D0BCFF');
    });

    it('listPalettes should return palette data', async () => {
      const result = await client.callTool({ name: 'listPalettes', arguments: {} });

      expect(result.isError).toBeFalsy();
      const text = (result.content as { type: string; text: string }[])[0].text;
      const data = JSON.parse(text);
      const primary = data.find((p: { name: string }) => p.name === 'primary');
      expect(primary).toBeDefined();
      expect(primary.hue).toBeCloseTo(271.6);
      expect(primary.chroma).toBeCloseTo(56.2);
    });
  });

  // ── Resources ──────────────────────────────────────────

  describe('Resources', () => {
    it('should list resource templates', async () => {
      const { resourceTemplates } = await client.listResourceTemplates();

      const uris = resourceTemplates.map((r) => r.uriTemplate);
      expect(uris).toContain('doc://{path}');
      expect(uris).toContain('theme://tokens');
    });

    it('readResource theme://tokens should return theme JSON', async () => {
      const result = await client.readResource({ uri: 'theme://tokens' });

      expect(result.contents).toHaveLength(1);
      const content = result.contents[0];
      expect(content.mimeType).toBe('application/json');

      const data = JSON.parse((content as { text: string }).text);
      expect(data.config).toBeDefined();
      expect(data.colors).toBeDefined();
    });

    it('readResource doc://button.mdx should return markdown', async () => {
      const result = await client.readResource({ uri: 'doc://button.mdx' });

      expect(result.contents).toHaveLength(1);
      const content = result.contents[0];
      expect(content.mimeType).toBe('text/markdown');
      expect((content as { text: string }).text).toContain('Button');
    });
  });

  // ── Regression: CallToolResult schema conformance ─────

  describe('Regression: every tool must return valid CallToolResult', () => {
    it('all tools should return content[0].text as a string, never undefined', async () => {
      const { tools } = await client.listTools();

      const argsMap: Record<string, Record<string, unknown>> = {
        listComponents: {},
        getComponentDoc: { name: 'Button' },
        searchDocs: { query: 'button' },
        getThemeTokens: {},
        getThemeConfig: {},
        listColors: { mode: 'light' },
        getColor: { name: 'primary', mode: 'light' },
        listPalettes: {},
        compareColor: { name: 'primary' },
      };

      for (const tool of tools) {
        const args = argsMap[tool.name] ?? {};
        const result = await client.callTool({
          name: tool.name,
          arguments: args,
        });

        // The SDK would throw McpError if content[0].text was undefined
        // This test ensures no tool silently produces invalid responses
        const content = result.content as { type: string; text: string }[];
        expect(content).toBeDefined();
        expect(content.length).toBeGreaterThan(0);
        expect(typeof content[0].text).toBe('string');
        expect(content[0].text.length).toBeGreaterThan(0);
        expect(content[0].type).toBe('text');

        // Verify the text is valid JSON
        expect(() => JSON.parse(content[0].text)).not.toThrow();
      }
    });

    it('getThemeConfig should still return valid response when config data is missing', async () => {
      // Simulate a broken theme.json without config field
      const { getThemeConfig: mockedGetConfig } = await import('./loaders/theme');
      const original = vi.mocked(mockedGetConfig).getMockImplementation();

      vi.mocked(mockedGetConfig).mockResolvedValueOnce(undefined as never);

      const result = await client.callTool({
        name: 'getThemeConfig',
        arguments: {},
      });

      // Should NOT throw McpError — the response must still be schema-valid
      const content = result.content as { type: string; text: string }[];
      expect(typeof content[0].text).toBe('string');

      // Restore
      if (original) vi.mocked(mockedGetConfig).mockImplementation(original);
    });
  });

  // ── Realistic AI workflow scenarios ────────────────────

  describe('AI workflow scenarios', () => {
    it('scenario: AI discovers available components then gets details', async () => {
      // Step 1: AI lists available tools
      const { tools } = await client.listTools();
      expect(tools.length).toBeGreaterThan(0);

      // Step 2: AI calls listComponents to see what is available
      const listResult = await client.callTool({
        name: 'listComponents',
        arguments: {},
      });
      const components = JSON.parse(
        (listResult.content as { type: string; text: string }[])[0].text,
      );

      // Step 3: AI picks a component and gets its docs
      const componentName = components.components[0].name;
      const docResult = await client.callTool({
        name: 'getComponentDoc',
        arguments: { name: componentName },
      });
      const doc = JSON.parse(
        (docResult.content as { type: string; text: string }[])[0].text,
      );
      expect(doc.name).toBe(componentName);
    });

    it('scenario: AI explores theme to generate a color palette', async () => {
      // Step 1: Get theme config to understand the base
      const configResult = await client.callTool({
        name: 'getThemeConfig',
        arguments: {},
      });
      const config = JSON.parse(
        (configResult.content as { type: string; text: string }[])[0].text,
      );
      expect(config.sourceColor).toBeDefined();

      // Step 2: List all colors in light mode
      const colorsResult = await client.callTool({
        name: 'listColors',
        arguments: { mode: 'light' },
      });
      const colorNames = JSON.parse(
        (colorsResult.content as { type: string; text: string }[])[0].text,
      );

      // Step 3: Get details for each color
      for (const name of colorNames) {
        const result = await client.callTool({
          name: 'getColor',
          arguments: { name, mode: 'light' },
        });
        const color = JSON.parse(
          (result.content as { type: string; text: string }[])[0].text,
        );
        expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }

      // Step 4: Compare primary between modes
      const compareResult = await client.callTool({
        name: 'compareColor',
        arguments: { name: 'primary' },
      });
      const comparison = JSON.parse(
        (compareResult.content as { type: string; text: string }[])[0].text,
      );
      expect(comparison.light.hex).not.toBe(comparison.dark.hex);
    });

    it('scenario: AI searches docs then reads the full resource', async () => {
      // Step 1: Search for a topic
      const searchResult = await client.callTool({
        name: 'searchDocs',
        arguments: { query: 'button' },
      });
      const results = JSON.parse(
        (searchResult.content as { type: string; text: string }[])[0].text,
      );
      expect(results.length).toBeGreaterThan(0);

      // Step 2: Read the full doc via resource
      const docResult = await client.readResource({
        uri: `doc://${results[0].file}`,
      });
      expect(docResult.contents[0]).toBeDefined();
      expect((docResult.contents[0] as { text: string }).text).toContain('Button');
    });
  });
});
