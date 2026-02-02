import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Stats } from 'node:fs';

// Mock data for testing
const mockComponentsIndex = {
  count: 3,
  components: [
    { name: 'Button', file: 'components/Button.tsx' },
    { name: 'Card', file: 'components/Card.tsx' },
    { name: 'Dialog', file: 'components/Dialog.tsx' },
  ],
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

import fs from 'node:fs/promises';
import { globby } from 'globby';
import { loadComponentsIndex, loadComponentDoc } from './components';

describe('Components Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadComponentsIndex', () => {
    it('should load components index from bundled file', async () => {
      vi.mocked(fs.stat).mockResolvedValue({} as Stats);
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(mockComponentsIndex),
      );

      const index = await loadComponentsIndex();

      expect(index).toBeDefined();
      expect(typeof index.count).toBe('number');
      expect(Array.isArray(index.components)).toBe(true);
    });

    it('should have components with name and file properties', async () => {
      vi.mocked(fs.stat).mockResolvedValue({} as Stats);
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(mockComponentsIndex),
      );

      const index = await loadComponentsIndex();

      expect(index.components.length).toBeGreaterThan(0);

      for (const component of index.components) {
        expect(typeof component.name).toBe('string');
        expect(typeof component.file).toBe('string');
      }
    });

    it('should have count matching components array length', async () => {
      vi.mocked(fs.stat).mockResolvedValue({} as Stats);
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(mockComponentsIndex),
      );

      const index = await loadComponentsIndex();

      expect(index.count).toBe(index.components.length);
    });

    it('should include common UI components', async () => {
      vi.mocked(fs.stat).mockResolvedValue({} as Stats);
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(mockComponentsIndex),
      );

      const index = await loadComponentsIndex();
      const componentNames = index.components.map(
        (c: { name: string }) => c.name,
      );

      const hasComponents = componentNames.some(
        (name: string) =>
          name.includes('Button') ||
          name.includes('Card') ||
          name.includes('Dialog'),
      );

      expect(hasComponents).toBe(true);
    });

    it('should throw error when bundled file not found', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

      await expect(loadComponentsIndex()).rejects.toThrow(
        'Bundled components-index.json not found',
      );
    });
  });

  describe('loadComponentDoc', () => {
    it('should return component doc info with matching docs', async () => {
      vi.mocked(fs.stat).mockResolvedValue({} as Stats);
      vi.mocked(globby).mockResolvedValue([
        '/path/to/bundled/doc-src/components/Button.mdx',
        '/path/to/bundled/doc-src/components/Button.stories.tsx',
      ]);

      const doc = await loadComponentDoc('Button');

      expect(doc).toBeDefined();
      expect(doc.name).toBe('Button');
      expect(Array.isArray(doc.docs)).toBe(true);
    });

    it('should handle non-existent component gracefully', async () => {
      vi.mocked(fs.stat).mockResolvedValue({} as Stats);
      vi.mocked(globby).mockResolvedValue([]);

      const doc = await loadComponentDoc('NonExistentComponent12345');

      expect(doc).toBeDefined();
      expect(doc.name).toBe('NonExistentComponent12345');
      expect(doc.docs).toEqual([]);
    });

    it('should throw error when bundled docs not found', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

      await expect(loadComponentDoc('Button')).rejects.toThrow(
        'Bundled docs not found',
      );
    });

    it('should search for multiple patterns', async () => {
      vi.mocked(fs.stat).mockResolvedValue({} as Stats);
      vi.mocked(globby).mockResolvedValue([]);

      await loadComponentDoc('TestComponent');

      expect(globby).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('TestComponent'),
          expect.stringContaining('testcomponent'),
        ]),
        expect.any(Object),
      );
    });
  });
});