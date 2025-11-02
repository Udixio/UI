import { loadComponentsIndex, loadComponentDoc } from './loaders/components';
import { searchDocs, getDocByPath } from './loaders/docs';
import { loadThemeTokens } from './loaders/theme';

describe('@udixio/mcp loaders (bundled snapshot)', () => {
  it('loadComponentsIndex returns bundled components index', async () => {
    const idx = await loadComponentsIndex();
    expect(idx).toBeTruthy();
    expect(Array.isArray(idx.components)).toBe(true);
    expect(idx.count).toBeGreaterThan(0);
    const names = idx.components.map((c: any) => c.name);
    expect(names).toEqual(expect.arrayContaining(['Button', 'Card']));
  });

  it('loadComponentDoc finds docs matching component name in bundled doc-src', async () => {
    const res = await loadComponentDoc('Getting-Started');
    // Our heuristic uses direct name; ensure no throw and result shape
    expect(res).toHaveProperty('name');
    expect(res).toHaveProperty('docs');
    expect(Array.isArray(res.docs)).toBe(true);
  });

  it('searchDocs returns results for a known term in bundled docs', async () => {
    const results = await searchDocs('Started', 5);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    const files = results.map((r: any) => r.file);
    expect(files.join('\n')).toMatch(/getting-started\.mdx/);
  });

  it('getDocByPath reads a bundled doc file', async () => {
    const file = await getDocByPath('getting-started.mdx');
    expect(file.mimeType).toBe('text/markdown');
    expect(file.content).toMatch(/# Getting Started/);
  });

  it('loadThemeTokens returns bundled theme object', async () => {
    const theme = await loadThemeTokens();
    expect(theme).toBeTruthy();
    expect(theme.colors.primary).toBe('#6750A4');
  });
});
