# @udixio/mcp

Model Context Protocol (MCP) server for the Udixio UI Design System. This package exposes tools and resources to interact with the UI library documentation and theme tokens.

## Installation

```bash
npm install @udixio/mcp
# or
pnpm add @udixio/mcp
```

## Usage

### Running the MCP Server

```bash
# Development
pnpm dev

# Production
pnpm start
```

The server runs on `http://localhost:3000/mcp` by default.

### Configuring with Claude Desktop

Add to your Claude Desktop configuration (`~/.config/claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "udixio-ui": {
      "command": "npx",
      "args": ["@udixio/mcp"]
    }
  }
}
```

## Available Tools

### Components

| Tool | Description |
|------|-------------|
| `listComponents` | Lists all available UI components |
| `getComponentDoc` | Gets documentation for a specific component (props, examples, links) |

### Documentation

| Tool | Description |
|------|-------------|
| `searchDocs` | Full-text search in the documentation |

### Theme

| Tool | Description |
|------|-------------|
| `getThemeTokens` | Gets all theme tokens (config, light/dark colors, palettes) |
| `getThemeConfig` | Gets theme configuration (sourceColor, contrastLevel, variant) |
| `listColors` | Lists all available colors in the theme |
| `getColor` | Gets details of a specific color (hex, tone) in light or dark mode |
| `listPalettes` | Lists all color palettes (hue, chroma) |
| `compareColor` | Compares a color between light and dark modes |

## Available Resources

| Resource | URI Pattern | Description |
|----------|-------------|-------------|
| `doc` | `doc://{path}` | Access documentation files |
| `theme` | `theme://tokens` | Access complete theme tokens |

## Example Queries

### Get theme configuration
```
Tool: getThemeConfig
```

### Get a specific color in dark mode
```
Tool: getColor
Input: { "name": "primary", "mode": "dark" }
```

### Compare primary color between modes
```
Tool: compareColor
Input: { "name": "primary" }
```

### List all available palettes
```
Tool: listPalettes
```

## Building

```bash
pnpm build
```

## Development

```bash
# Run in development mode with hot reload
pnpm dev

# Run tests
pnpm test
```

## Architecture

The MCP server bundles documentation and theme data at build time via the `snapshot.ts` script. This allows the package to work standalone without requiring access to the full monorepo.

### Bundled Assets

- `bundled/doc-src/` - Documentation source files (md, mdx, astro)
- `bundled/components-index.json` - Index of all UI components
- `bundled/theme.json` - Complete theme snapshot with colors and palettes

## License

MIT
