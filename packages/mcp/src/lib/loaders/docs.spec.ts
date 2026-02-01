import { describe, it, expect } from 'vitest';
import { searchDocs, getDocByPath } from './docs';

describe('Docs Loader', () => {
  describe('searchDocs', () => {
    it('should search docs and return results', async () => {
      const results = await searchDocs('button', 10);

      expect(Array.isArray(results)).toBe(true);
    });

    it('should return results with expected structure', async () => {
      const results = await searchDocs('component', 5);

      for (const result of results) {
        expect(typeof result.file).toBe('string');
        expect(typeof result.score).toBe('number');
      }
    });

    it('should respect limit parameter', async () => {
      const results = await searchDocs('a', 3);

      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array for non-matching query', async () => {
      const results = await searchDocs('xyznonexistentquery12345', 10);

      expect(results).toEqual([]);
    });

    it('should sort results by score descending', async () => {
      const results = await searchDocs('button', 10);

      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
        }
      }
    });
  });

  describe('getDocByPath', () => {
    it('should throw error for non-existent file', async () => {
      await expect(getDocByPath('non-existent-file.md')).rejects.toThrow();
    });
  });
});
