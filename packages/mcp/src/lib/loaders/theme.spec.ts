import { describe, it, expect } from 'vitest';
import {
  loadThemeTokens,
  getColor,
  listColors,
  listPalettes,
  getThemeConfig,
  ThemeSnapshot,
} from './theme';

describe('Theme Loader', () => {
  describe('loadThemeTokens', () => {
    it('should load theme tokens from bundled file', async () => {
      const tokens = await loadThemeTokens();

      expect(tokens).toBeDefined();
      expect(tokens.config).toBeDefined();
      expect(tokens.palettes).toBeDefined();
      expect(tokens.colors).toBeDefined();
      expect(tokens.colors.light).toBeDefined();
      expect(tokens.colors.dark).toBeDefined();
    });

    it('should have valid config structure', async () => {
      const tokens = await loadThemeTokens();

      expect(tokens.config.sourceColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof tokens.config.contrastLevel).toBe('number');
      expect(typeof tokens.config.isDark).toBe('boolean');
      expect(typeof tokens.config.variant).toBe('string');
    });

    it('should have required palettes', async () => {
      const tokens = await loadThemeTokens();
      const requiredPalettes = ['primary', 'secondary', 'tertiary', 'neutral', 'error'];

      for (const palette of requiredPalettes) {
        expect(tokens.palettes[palette]).toBeDefined();
        expect(typeof tokens.palettes[palette].hue).toBe('number');
        expect(typeof tokens.palettes[palette].chroma).toBe('number');
      }
    });

    it('should have colors in both light and dark modes', async () => {
      const tokens = await loadThemeTokens();

      expect(Object.keys(tokens.colors.light).length).toBeGreaterThan(0);
      expect(Object.keys(tokens.colors.dark).length).toBeGreaterThan(0);
    });
  });

  describe('getColor', () => {
    it('should return a color by name in light mode', async () => {
      const color = await getColor('primary', 'light');

      expect(color).toBeDefined();
      expect(color?.name).toBe('primary');
      expect(color?.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof color?.tone).toBe('number');
    });

    it('should return a color by name in dark mode', async () => {
      const color = await getColor('primary', 'dark');

      expect(color).toBeDefined();
      expect(color?.name).toBe('primary');
      expect(color?.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should return null for non-existent color', async () => {
      const color = await getColor('nonExistentColor', 'light');

      expect(color).toBeNull();
    });

    it('should default to light mode when mode is not specified', async () => {
      const colorLight = await getColor('primary', 'light');
      const colorDefault = await getColor('primary');

      expect(colorDefault).toEqual(colorLight);
    });
  });

  describe('listColors', () => {
    it('should return an array of color names in light mode', async () => {
      const colors = await listColors('light');

      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
      expect(colors).toContain('primary');
      expect(colors).toContain('surface');
    });

    it('should return an array of color names in dark mode', async () => {
      const colors = await listColors('dark');

      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should have same color names in both modes', async () => {
      const lightColors = await listColors('light');
      const darkColors = await listColors('dark');

      expect(lightColors.sort()).toEqual(darkColors.sort());
    });
  });

  describe('listPalettes', () => {
    it('should return an array of palettes with name, hue, and chroma', async () => {
      const palettes = await listPalettes();

      expect(Array.isArray(palettes)).toBe(true);
      expect(palettes.length).toBeGreaterThan(0);

      for (const palette of palettes) {
        expect(typeof palette.name).toBe('string');
        expect(typeof palette.hue).toBe('number');
        expect(typeof palette.chroma).toBe('number');
      }
    });

    it('should include primary palette', async () => {
      const palettes = await listPalettes();
      const primary = palettes.find((p) => p.name === 'primary');

      expect(primary).toBeDefined();
    });
  });

  describe('getThemeConfig', () => {
    it('should return the theme configuration', async () => {
      const config = await getThemeConfig();

      expect(config).toBeDefined();
      expect(config.sourceColor).toBeDefined();
      expect(typeof config.contrastLevel).toBe('number');
      expect(typeof config.isDark).toBe('boolean');
      expect(typeof config.variant).toBe('string');
    });
  });
});
