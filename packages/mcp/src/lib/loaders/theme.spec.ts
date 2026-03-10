import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Stats } from 'node:fs';
import type { ThemeSnapshot } from './theme';

// Mock theme data for testing
const mockThemeSnapshot: ThemeSnapshot = {
  config: {
    sourceColor: '#6750A4',
    contrastLevel: 0,
    isDark: false,
    variant: 'TONAL_SPOT',
  },
  palettes: {
    primary: { hue: 271.6, chroma: 56.2 },
    secondary: { hue: 271.6, chroma: 16.0 },
    tertiary: { hue: 331.6, chroma: 32.0 },
    neutral: { hue: 271.6, chroma: 4.0 },
    neutralVariant: { hue: 271.6, chroma: 8.0 },
    error: { hue: 25.0, chroma: 84.0 },
  },
  colors: {
    light: {
      primary: { hex: '#6750A4', tone: 40 },
      onPrimary: { hex: '#FFFFFF', tone: 100 },
      surface: { hex: '#FFFBFE', tone: 99 },
      onSurface: { hex: '#1C1B1F', tone: 10 },
      secondary: { hex: '#625B71', tone: 40 },
    },
    dark: {
      primary: { hex: '#D0BCFF', tone: 80 },
      onPrimary: { hex: '#381E72', tone: 20 },
      surface: { hex: '#1C1B1F', tone: 6 },
      onSurface: { hex: '#E6E1E5', tone: 90 },
      secondary: { hex: '#CCC2DC', tone: 80 },
    },
  },
  customPalettes: [],
};

// Mock fs module
vi.mock('node:fs/promises', () => ({
  default: {
    stat: vi.fn(),
    readFile: vi.fn(),
  },
}));

import fs from 'node:fs/promises';
import {
  loadThemeTokens,
  getColor,
  listColors,
  listPalettes,
  getThemeConfig,
} from './theme';

describe('Theme Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: file exists and returns mock data
    vi.mocked(fs.stat).mockResolvedValue({} as Stats);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockThemeSnapshot));
  });

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
      const requiredPalettes = [
        'primary',
        'secondary',
        'tertiary',
        'neutral',
        'error',
      ];

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

    it('should throw error when bundled file not found', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

      await expect(loadThemeTokens()).rejects.toThrow(
        'Bundled theme.json not found',
      );
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

    it('should return different values for light and dark modes', async () => {
      const colorLight = await getColor('primary', 'light');
      const colorDark = await getColor('primary', 'dark');

      expect(colorLight?.hex).not.toBe(colorDark?.hex);
      expect(colorLight?.tone).not.toBe(colorDark?.tone);
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

    it('should default to light mode when mode is not specified', async () => {
      const colorsLight = await listColors('light');
      const colorsDefault = await listColors();

      expect(colorsDefault).toEqual(colorsLight);
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

    it('should include all required palettes', async () => {
      const palettes = await listPalettes();
      const names = palettes.map((p) => p.name);

      expect(names).toContain('primary');
      expect(names).toContain('secondary');
      expect(names).toContain('tertiary');
      expect(names).toContain('neutral');
      expect(names).toContain('error');
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

    it('should return correct config values', async () => {
      const config = await getThemeConfig();

      expect(config.sourceColor).toBe('#6750A4');
      expect(config.contrastLevel).toBe(0);
      expect(config.isDark).toBe(false);
      expect(config.variant).toBe('TONAL_SPOT');
    });
  });
});
