import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadComponentDoc, loadComponentsIndex } from './loaders/components.js';
import { getDocByPath, searchDocs } from './loaders/docs.js';
import { loadThemeTokens } from './loaders/theme.js';

export function registerToolsAndResources(server: McpServer) {
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
            text: JSON.stringify(list, null, 2),
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
      name: z.string().describe('Nom du composant'),
      outputSchema: { doc: z.any() },
    },
    async ({ name }) => {
      const doc = await loadComponentDoc(name);
      return {
        content: [
          {
            type: 'text' as const,
            text: typeof doc === 'string' ? doc : JSON.stringify(doc, null, 2),
          },
        ],
      };
    },
  );

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
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    },
  );

  // Tool: tokens de thème
  server.registerTool(
    'getThemeTokens',
    {
      title: 'Get Theme Tokens',
      description: 'Expose les couleurs/tokens depuis theme.config.(ts|json)',
      inputSchema: {},
    },
    async () => {
      const tokens = await loadThemeTokens();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(tokens, null, 2),
          },
        ],
      };
    },
  );

  // Resource: exposer un fichier de doc par chemin (nouvelle API)
  server.registerResource(
    'doc',
    new ResourceTemplate('doc://{path}', { list: undefined }),
    {
      title: 'Doc Resource',
      description: 'Lit un fichier de doc relatif à apps/doc',
    },
    async (uri, { path }) => {
      const file = await getDocByPath(path);
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
}
