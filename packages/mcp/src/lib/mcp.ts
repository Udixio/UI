import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadComponentDoc, loadComponentsIndex } from './loaders/components.js';
import { getDocByPath, searchDocs } from './loaders/docs.js';
import {
  loadThemeTokens,
  getColor,
  listColors,
  listPalettes,
  getThemeConfig,
} from './loaders/theme.js';

function toJsonText(value: unknown): string {
  const json = JSON.stringify(value, null, 2);
  return json ?? JSON.stringify({ error: 'No data available' });
}

export function registerToolsAndResources(server: McpServer) {
  // ============ COMPONENTS TOOLS ============

  // Tool: list components
  server.registerTool(
    'listComponents',
    {
      title: 'List Components',
      description: 'Lists all available UI components',
      inputSchema: {},
    },
    async () => {
      const list = await loadComponentsIndex();
      return {
        content: [
          {
            type: 'text' as const,
            text: toJsonText(list),
          },
        ],
      };
    },
  );

  // Tool: get a component's doc
  server.registerTool(
    'getComponentDoc',
    {
      title: 'Get Component Doc',
      description: "Gets a component's doc (props, examples, links)",
      inputSchema: {
        name: z.string().describe('Component name'),
      },
    },
    async ({ name }) => {
      const doc = await loadComponentDoc(name);
      return {
        content: [
          {
            type: 'text' as const,
            text: typeof doc === 'string' ? doc : toJsonText(doc),
          },
        ],
      };
    },
  );

  // ============ DOCS TOOLS ============

  // Tool: search the Astro docs
  server.registerTool(
    'searchDocs',
    {
      title: 'Search Docs',
      description: 'Full-text search in the documentation',
      inputSchema: {
        query: z.string(),
        limit: z.number().optional().default(10),
      },
    },
    async ({ query, limit = 10 }) => {
      const results = await searchDocs(query, limit);
      return {
        content: [
          {
            type: 'text' as const,
            text: toJsonText(results),
          },
        ],
      };
    },
  );

  // ============ THEME TOOLS ============

  // Tool: get all theme tokens
  server.registerTool(
    'getThemeTokens',
    {
      title: 'Get Theme Tokens',
      description:
        'Gets all theme tokens (config, light/dark colors, palettes)',
      inputSchema: {},
    },
    async () => {
      const tokens = await loadThemeTokens();
      return {
        content: [
          {
            type: 'text' as const,
            text: toJsonText(tokens),
          },
        ],
      };
    },
  );

  // Tool: get the theme configuration
  server.registerTool(
    'getThemeConfig',
    {
      title: 'Get Theme Config',
      description:
        'Gets the theme configuration (sourceColor, contrastLevel, variant)',
      inputSchema: {},
    },
    async () => {
      const config = await getThemeConfig();
      return {
        content: [
          {
            type: 'text' as const,
            text: toJsonText(config),
          },
        ],
      };
    },
  );

  // Tool: list available colors
  server.registerTool(
    'listColors',
    {
      title: 'List Colors',
      description: 'Lists all colors available in the theme',
      inputSchema: {
        mode: z
          .enum(['light', 'dark'])
          .optional()
          .default('light')
          .describe('Color mode (light or dark)'),
      },
    },
    async ({ mode = 'light' }) => {
      const colors = await listColors(mode);
      return {
        content: [
          {
            type: 'text' as const,
            text: toJsonText(colors),
          },
        ],
      };
    },
  );

  // Tool: get a specific color
  server.registerTool(
    'getColor',
    {
      title: 'Get Color',
      description:
        'Gets the details of a specific color (hex, tone) in light or dark mode',
      inputSchema: {
        name: z.string().describe('Color name (e.g. primary, surface)'),
        mode: z
          .enum(['light', 'dark'])
          .optional()
          .default('light')
          .describe('Color mode'),
      },
    },
    async ({ name, mode = 'light' }) => {
      const color = await getColor(name, mode);
      if (!color) {
        return {
          content: [
            {
              type: 'text' as const,
              text: toJsonText({ error: `Color '${name}' not found` }),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: toJsonText(color),
          },
        ],
      };
    },
  );

  // Tool: list palettes
  server.registerTool(
    'listPalettes',
    {
      title: 'List Palettes',
      description: 'Lists all color palettes (hue, chroma)',
      inputSchema: {},
    },
    async () => {
      const palettes = await listPalettes();
      return {
        content: [
          {
            type: 'text' as const,
            text: toJsonText(palettes),
          },
        ],
      };
    },
  );

  // Tool: compare a color in light and dark mode
  server.registerTool(
    'compareColor',
    {
      title: 'Compare Color',
      description:
        'Compares a color between light and dark modes to see the differences',
      inputSchema: {
        name: z.string().describe('Name of the color to compare'),
      },
    },
    async ({ name }) => {
      const [light, dark] = await Promise.all([
        getColor(name, 'light'),
        getColor(name, 'dark'),
      ]);

      if (!light && !dark) {
        return {
          content: [
            {
              type: 'text' as const,
              text: toJsonText({ error: `Color '${name}' not found` }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: toJsonText({ name, light, dark }),
          },
        ],
      };
    },
  );

  // ============ RESOURCES ============

  // Resource: expose a doc file by path (new API)
  server.registerResource(
    'doc',
    new ResourceTemplate('doc://{path}', { list: undefined }),
    {
      title: 'Doc Resource',
      description: 'Reads a doc file relative to apps/doc',
    },
    async (uri, { path }) => {
      const pathStr = Array.isArray(path) ? path.join('/') : path;
      const file = await getDocByPath(pathStr);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: file.mimeType,
            text: file.content,
          },
        ],
      };
    },
  );

  // Resource: expose the theme tokens
  server.registerResource(
    'theme',
    new ResourceTemplate('theme://tokens', { list: undefined }),
    {
      title: 'Theme Tokens Resource',
      description: 'Access to the full theme tokens',
    },
    async (uri) => {
      const tokens = await loadThemeTokens();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: toJsonText(tokens),
          },
        ],
      };
    },
  );
}
