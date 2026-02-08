#!/usr/bin/env node
declare const __PKG_VERSION__: string;

import { registerToolsAndResources } from './mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--http')) {
    await startHttpServer();
  } else {
    await startStdioServer();
  }
}

async function startStdioServer() {
  const server = new McpServer({
    name: '@udixio/mcp',
    version: __PKG_VERSION__,
  });

  registerToolsAndResources(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function startHttpServer() {
  const { default: express } = await import('express');
  const { StreamableHTTPServerTransport } = await import(
    '@modelcontextprotocol/sdk/server/streamableHttp.js'
  );

  const server = new McpServer({
    name: '@udixio/mcp',
    version: __PKG_VERSION__,
  });

  registerToolsAndResources(server);

  const app = express();
  app.use(express.json());

  app.post('/mcp', async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      transport.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || '3000');
  app
    .listen(port, () => {
      console.log(`MCP Server running on http://localhost:${port}/mcp`);
    })
    .on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });
}
