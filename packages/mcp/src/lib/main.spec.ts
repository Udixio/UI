import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import pkg from '../../package.json';

const { mockConnect, mockStdioTransport, mockListen, mockPost, mockUse } =
  vi.hoisted(() => {
    const mockConnect = vi.fn();
    const mockStdioTransport = {};
    const mockListen = vi.fn().mockReturnValue({ on: vi.fn() });
    const mockPost = vi.fn();
    const mockUse = vi.fn();
    return { mockConnect, mockStdioTransport, mockListen, mockPost, mockUse };
  });

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn().mockImplementation((opts: unknown) => ({
    opts,
    connect: mockConnect,
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockReturnValue(mockStdioTransport),
}));

vi.mock('./mcp', () => ({
  registerToolsAndResources: vi.fn(),
}));

vi.mock('express', () => {
  const expressFn = vi.fn(() => ({
    use: mockUse,
    post: mockPost,
    listen: mockListen,
  }));
  expressFn.json = vi.fn();
  return { default: expressFn };
});

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn(),
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerToolsAndResources } from './mcp';
import { main } from './main';

describe('main', () => {
  let originalArgv: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    originalArgv = process.argv;
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  describe('__PKG_VERSION__', () => {
    it('should inject version from package.json at build time', async () => {
      process.argv = ['node', 'cli.mjs'];
      await main();

      expect(McpServer).toHaveBeenCalledWith({
        name: '@udixio/mcp',
        version: pkg.version,
      });
    });
  });

  describe('stdio mode (default)', () => {
    it('should start stdio server when no --http flag', async () => {
      process.argv = ['node', 'cli.mjs'];
      await main();

      expect(StdioServerTransport).toHaveBeenCalled();
      expect(mockConnect).toHaveBeenCalledWith(mockStdioTransport);
    });

    it('should register tools and resources', async () => {
      process.argv = ['node', 'cli.mjs'];
      await main();

      expect(registerToolsAndResources).toHaveBeenCalled();
    });

    it('should not start express server', async () => {
      process.argv = ['node', 'cli.mjs'];
      await main();

      expect(mockListen).not.toHaveBeenCalled();
    });
  });

  describe('http mode (--http)', () => {
    it('should start HTTP server when --http flag is provided', async () => {
      process.argv = ['node', 'cli.mjs', '--http'];
      await main();

      expect(mockListen).toHaveBeenCalled();
    });

    it('should not start stdio transport', async () => {
      process.argv = ['node', 'cli.mjs', '--http'];
      await main();

      expect(StdioServerTransport).not.toHaveBeenCalled();
    });

    it('should register POST /mcp route', async () => {
      process.argv = ['node', 'cli.mjs', '--http'];
      await main();

      expect(mockPost).toHaveBeenCalledWith('/mcp', expect.any(Function));
    });

    it('should listen on port 3000 by default', async () => {
      process.argv = ['node', 'cli.mjs', '--http'];
      await main();

      expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
    });

    it('should respect PORT environment variable', async () => {
      process.argv = ['node', 'cli.mjs', '--http'];
      const originalPort = process.env.PORT;
      process.env.PORT = '8080';

      await main();

      expect(mockListen).toHaveBeenCalledWith(8080, expect.any(Function));
      if (originalPort === undefined) {
        delete process.env.PORT;
      } else {
        process.env.PORT = originalPort;
      }
    });

    it('should register tools and resources', async () => {
      process.argv = ['node', 'cli.mjs', '--http'];
      await main();

      expect(registerToolsAndResources).toHaveBeenCalled();
    });
  });
});
