import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Stats } from 'node:fs';

// Mock doc files content
const mockDocFiles = [
  '/docs/bundled/doc-src/components/button.mdx',
  '/docs/bundled/doc-src/components/card.md',
  '/docs/bundled/doc-src/getting-started.md',
];

const mockFileContents: Record<string, string> = {
  '/docs/bundled/doc-src/components/button.mdx': `---
title: Button Component
description: A versatile button component
---

# Button

The Button component is used for user interactions. Click the button to trigger an action.

## Usage

\`\`\`tsx
<Button variant="primary">Click me</Button>
\`\`\`
`,
  '/docs/bundled/doc-src/components/card.md': `---
title: Card Component
---

# Card

A container component for grouping content.
`,
  '/docs/bundled/doc-src/getting-started.md': `---
title: Getting Started
---

# Getting Started

Welcome to the component library.
`,
};

// Mock fs module
vi.mock('node:fs/promises', () => ({
  default: {
    stat: vi.fn(),
    readFile: vi.fn(),
  },
}));

// Mock globby
vi.mock('globby', () => ({
  globby: vi.fn(),
}));

// Mock gray-matter
vi.mock('gray-matter', () => ({
  default: vi.fn((text: string) => {
    // Simple frontmatter parser mock
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (match) {
      const frontmatter = match[1];
      const content = match[2];
      const data: Record<string, string> = {};
      frontmatter.split('\n').forEach((line) => {
        const [key, value] = line.split(':').map((s) => s.trim());
        if (key && value) {
          data[key] = value;
        }
      });
      return { content, data };
    }
    return { content: text, data: {} };
  }),
}));

import fs from 'node:fs/promises';
import { globby } from 'globby';
import { searchDocs, getDocByPath } from './docs';

describe('Docs Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: doc base exists
    vi.mocked(fs.stat).mockResolvedValue({} as Stats);
  });

  describe('searchDocs', () => {
    it('should search docs and return results', async () => {
      vi.mocked(globby).mockResolvedValue(mockDocFiles);
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        return mockFileContents[path as string] || '';
      });

      const results = await searchDocs('button', 10);

      expect(Array.isArray(results)).toBe(true);
    });

    it('should return results with expected structure', async () => {
      vi.mocked(globby).mockResolvedValue(mockDocFiles);
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        return mockFileContents[path as string] || '';
      });

      const results = await searchDocs('Button', 5);

      for (const result of results) {
        expect(typeof result.file).toBe('string');
        expect(typeof result.score).toBe('number');
      }
    });

    it('should respect limit parameter', async () => {
      vi.mocked(globby).mockResolvedValue(mockDocFiles);
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        return mockFileContents[path as string] || 'a';
      });

      const results = await searchDocs('a', 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array for non-matching query', async () => {
      vi.mocked(globby).mockResolvedValue(mockDocFiles);
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        return mockFileContents[path as string] || '';
      });

      const results = await searchDocs('xyznonexistentquery12345', 10);

      expect(results).toEqual([]);
    });

    it('should sort results by score descending', async () => {
      vi.mocked(globby).mockResolvedValue(mockDocFiles);
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        return mockFileContents[path as string] || '';
      });

      const results = await searchDocs('component', 10);

      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
        }
      }
    });

    it('should include title and snippet in results', async () => {
      vi.mocked(globby).mockResolvedValue(mockDocFiles);
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        return mockFileContents[path as string] || '';
      });

      const results = await searchDocs('Button', 5);

      const buttonResult = results.find((r) => r.file.includes('button'));
      if (buttonResult) {
        expect(buttonResult.title).toBeDefined();
        expect(buttonResult.snippet).toBeDefined();
      }
    });

    it('should throw error when bundled docs not found', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

      await expect(searchDocs('button', 10)).rejects.toThrow(
        'Bundled documentation not found',
      );
    });
  });

  describe('getDocByPath', () => {
    it('should return doc content and mimeType for markdown files', async () => {
      const mdContent = mockFileContents['/docs/bundled/doc-src/components/card.md'];
      vi.mocked(fs.readFile).mockResolvedValue(mdContent);

      const doc = await getDocByPath('components/card.md');

      expect(doc.content).toBe(mdContent);
      expect(doc.mimeType).toBe('text/markdown');
    });

    it('should return doc content and mimeType for mdx files', async () => {
      const mdxContent =
        mockFileContents['/docs/bundled/doc-src/components/button.mdx'];
      vi.mocked(fs.readFile).mockResolvedValue(mdxContent);

      const doc = await getDocByPath('components/button.mdx');

      expect(doc.content).toBe(mdxContent);
      expect(doc.mimeType).toBe('text/markdown');
    });

    it('should return text/x-astro mimeType for astro files', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('<div>Astro content</div>');

      const doc = await getDocByPath('components/test.astro');

      expect(doc.mimeType).toBe('text/x-astro');
    });

    it('should throw error for non-existent file', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

      await expect(getDocByPath('non-existent-file.md')).rejects.toThrow();
    });
  });
});
