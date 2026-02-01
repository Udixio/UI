import { describe, it, expect } from 'vitest';
import { loadComponentsIndex, loadComponentDoc } from './components';

describe('Components Loader', () => {
  describe('loadComponentsIndex', () => {
    it('should load components index from bundled file', async () => {
      const index = await loadComponentsIndex();

      expect(index).toBeDefined();
      expect(typeof index.count).toBe('number');
      expect(Array.isArray(index.components)).toBe(true);
    });

    it('should have components with name and file properties', async () => {
      const index = await loadComponentsIndex();

      expect(index.components.length).toBeGreaterThan(0);

      for (const component of index.components) {
        expect(typeof component.name).toBe('string');
        expect(typeof component.file).toBe('string');
      }
    });

    it('should have count matching components array length', async () => {
      const index = await loadComponentsIndex();

      expect(index.count).toBe(index.components.length);
    });

    it('should include common UI components', async () => {
      const index = await loadComponentsIndex();
      const componentNames = index.components.map(
        (c: { name: string }) => c.name,
      );

      // Check for at least one common component pattern
      const hasComponents = componentNames.some(
        (name: string) =>
          name.includes('Button') ||
          name.includes('Input') ||
          name.includes('Card') ||
          name.includes('Dialog'),
      );

      expect(hasComponents).toBe(true);
    });
  });

  describe('loadComponentDoc', () => {
    it('should return component doc info', async () => {
      const doc = await loadComponentDoc('Button');

      expect(doc).toBeDefined();
      expect(doc.name).toBe('Button');
      expect(Array.isArray(doc.docs)).toBe(true);
    });

    it('should handle non-existent component gracefully', async () => {
      const doc = await loadComponentDoc('NonExistentComponent12345');

      expect(doc).toBeDefined();
      expect(doc.name).toBe('NonExistentComponent12345');
      expect(doc.docs).toEqual([]);
    });
  });
});
