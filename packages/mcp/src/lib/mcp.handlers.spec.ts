import { registerToolsAndResources } from './mcp';
import type { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

// Minimal mock implementations to capture tool/resource handlers

type ToolHandler = (input: any) => Promise<{ content: { type: 'text'; text: string }[] }>;

type ResourceHandler = (
  uri: URL,
  params: Record<string, any>
) => Promise<{ contents: { uri: string; mimeType?: string; text: string }[] }>;

class TestServer implements Partial<McpServer> {
  public tools = new Map<string, { config: any; handler: ToolHandler }>();
  public resources = new Map<string, { template: ResourceTemplate; meta: any; handler: ResourceHandler }>();

  registerTool(name: string, config: any, handler: ToolHandler) {
    this.tools.set(name, { config, handler });
    return this as any;
  }

  registerResource(name: string, template: ResourceTemplate, meta: any, handler: ResourceHandler) {
    this.resources.set(name, { template, meta, handler });
    return this as any;
  }
}

function parseFirstText(result: { content: { type: 'text'; text: string }[] }) {
  const first = result.content[0];
  return first?.text ?? '';
}

describe('MCP registered tools/resources (bundled snapshot)', () => {
  const server = new TestServer() as unknown as McpServer;
  registerToolsAndResources(server);

  it('listComponents returns JSON including Button and Card', async () => {
    const tool = (server as any).tools.get('listComponents');
    expect(tool).toBeTruthy();
    const res = await tool.handler({});
    const text = parseFirstText(res);
    expect(text).toMatch(/"components"/);
    expect(text).toMatch(/Button/);
    expect(text).toMatch(/Card/);
  });

  it('searchDocs finds the bundled getting-started page', async () => {
    const tool = (server as any).tools.get('searchDocs');
    expect(tool).toBeTruthy();
    const res = await tool.handler({ query: 'Started', limit: 5 });
    const text = parseFirstText(res);
    expect(text).toMatch(/getting-started\.mdx/);
  });

  it('getThemeTokens returns a themed JSON with primary color', async () => {
    const tool = (server as any).tools.get('getThemeTokens');
    expect(tool).toBeTruthy();
    const res = await tool.handler({});
    const text = parseFirstText(res);
    expect(() => JSON.parse(text)).not.toThrow();
    const data = JSON.parse(text);
    expect(data.colors.primary).toBe('#6750A4');
  });

  it('doc resource returns file content from bundled docs', async () => {
    const resEntry = (server as any).resources.get('doc');
    expect(resEntry).toBeTruthy();
    const url = new URL('doc://getting-started.mdx');
    const res = await resEntry.handler(url, { path: 'getting-started.mdx' });
    const item = res.contents[0];
    expect(item.uri).toBe(url.href);
    expect(item.text).toMatch(/# Getting Started/);
  });
});
