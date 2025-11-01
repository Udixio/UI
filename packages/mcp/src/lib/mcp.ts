import type { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { loadComponentDoc, loadComponentsIndex } from './loaders/components.js';
import { getDocByPath, searchDocs } from './loaders/docs.js';
import { loadThemeTokens } from './loaders/theme.js';

export function registerToolsAndResources(app: McpServer) {
  // Tool: lister les composants
  app.tool('listComponents', {
    description: 'Liste tous les composants UI disponibles',
    inputSchema: z.object({}).passthrough(),
    handler: async () => {
      const list = await loadComponentsIndex();
      return { content: list };
    },
  });

  // Tool: récupérer doc d'un composant
  app.tool('getComponentDoc', {
    description: 'Récupère la doc d’un composant (props, exemples, liens)',
    inputSchema: z.object({ name: z.string() }),
    handler: async ({ name }) => {
      const doc = await loadComponentDoc(name);
      return { content: doc };
    },
  });

  // Tool: rechercher dans la doc Astro
  app.tool('searchDocs', {
    description: 'Recherche plein texte dans la documentation',
    inputSchema: z.object({ query: z.string(), limit: z.number().optional() }),
    handler: async ({ query, limit = 10 }) => {
      const results = await searchDocs(query, limit);
      return { content: results };
    },
  });

  // Tool: tokens de thème
  app.tool('getThemeTokens', {
    description: 'Expose les couleurs/tokens depuis theme.config.(ts|json)',
    inputSchema: z.object({}).passthrough(),
    handler: async () => {
      const tokens = await loadThemeTokens();
      return { content: tokens };
    },
  });

  // Resource: exposer un fichier de doc par chemin
  app.resource.template('doc://{path}', {
    description: 'Lit un fichier de doc relatif à apps/doc',
    get: async ({ path }) => {
      const file = await getDocByPath(path);
      return {
        mimeType: file.mimeType,
        content: file.content,
      };
    },
  });
}
