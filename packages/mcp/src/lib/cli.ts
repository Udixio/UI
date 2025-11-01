#!/usr/bin/env node
import { createServer } from '@modelcontextprotocol/sdk/server/express';
import { registerToolsAndResources } from './index.js';

const port = Number(process.env.MCP_PORT || 3337);
const host = process.env.MCP_HOST || '127.0.0.1';

async function main() {
  const app = await createServer({
    name: '@udixio/mcp-ui',
    version: '0.1.0',
  });

  registerToolsAndResources(app);

  app.listen(port, host, () => {
    console.log(
      `MCP server @udixio/mcp-ui listening on http://${host}:${port}`,
    );
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
