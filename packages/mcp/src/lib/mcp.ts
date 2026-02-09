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

  // Tool: lister les composants
  server.registerTool(
    'listComponents',
    {
      title: 'List Components',
      description: 'Liste tous les composants UI disponibles',
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

  // Tool: récupérer doc d'un composant
  server.registerTool(
    'getComponentDoc',
    {
      title: 'Get Component Doc',
      description: "Récupère la doc d'un composant (props, exemples, liens)",
      inputSchema: {
        name: z.string().describe('Nom du composant'),
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

  // Tool: rechercher dans la doc Astro
  server.registerTool(
    'searchDocs',
    {
      title: 'Search Docs',
      description: 'Recherche plein texte dans la documentation',
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

  // Tool: récupérer tous les tokens de thème
  server.registerTool(
    'getThemeTokens',
    {
      title: 'Get Theme Tokens',
      description:
        'Récupère tous les tokens de thème (config, couleurs light/dark, palettes)',
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

  // Tool: récupérer la configuration du thème
  server.registerTool(
    'getThemeConfig',
    {
      title: 'Get Theme Config',
      description:
        'Récupère la configuration du thème (sourceColor, contrastLevel, variant)',
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

  // Tool: lister les couleurs disponibles
  server.registerTool(
    'listColors',
    {
      title: 'List Colors',
      description: 'Liste toutes les couleurs disponibles dans le thème',
      inputSchema: {
        mode: z
          .enum(['light', 'dark'])
          .optional()
          .default('light')
          .describe('Mode de couleur (light ou dark)'),
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

  // Tool: récupérer une couleur spécifique
  server.registerTool(
    'getColor',
    {
      title: 'Get Color',
      description:
        "Récupère les détails d'une couleur spécifique (hex, tone) en mode light ou dark",
      inputSchema: {
        name: z.string().describe('Nom de la couleur (ex: primary, surface)'),
        mode: z
          .enum(['light', 'dark'])
          .optional()
          .default('light')
          .describe('Mode de couleur'),
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

  // Tool: lister les palettes
  server.registerTool(
    'listPalettes',
    {
      title: 'List Palettes',
      description: 'Liste toutes les palettes de couleurs (hue, chroma)',
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

  // Tool: comparer une couleur en light et dark mode
  server.registerTool(
    'compareColor',
    {
      title: 'Compare Color',
      description:
        'Compare une couleur entre les modes light et dark pour voir les différences',
      inputSchema: {
        name: z.string().describe('Nom de la couleur à comparer'),
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

  // Resource: exposer un fichier de doc par chemin (nouvelle API)
  server.registerResource(
    'doc',
    new ResourceTemplate('doc://{path}', { list: undefined }),
    {
      title: 'Doc Resource',
      description: 'Lit un fichier de doc relatif à apps/doc',
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

  // Resource: exposer les tokens de thème
  server.registerResource(
    'theme',
    new ResourceTemplate('theme://tokens', { list: undefined }),
    {
      title: 'Theme Tokens Resource',
      description: 'Accès aux tokens de thème complets',
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
