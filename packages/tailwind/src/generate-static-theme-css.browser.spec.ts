import { chromium, type Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { defineConfig, FontPlugin } from '@udixio/theme';
import { TailwindPlugin } from './node/tailwind.plugin';
import { generateStaticThemeCss } from './generate-static-theme-css';
import { buildResolvedCss } from './emit/test-utils';

interface ThemeSnapshot {
  prefersDark: boolean;
  hasThemeOverrideClass: boolean;
  hasScript: boolean;
  bodyBackground: string;
  bodyText: string;
  probeBackground: string;
  probeText: string;
  lightSurface: string;
  darkSurface: string;
  lightOnSurface: string;
  darkOnSurface: string;
}

interface PaintSample extends ThemeSnapshot {
  name: string;
}

declare global {
  interface Window {
    __udxPaintSamples: PaintSample[];
  }
}

describe('generateStaticThemeCss in Chromium', () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser?.close();
  });

  it('paints the system palette on first render and when the preference changes', async () => {
    const css = await generateStaticThemeCss(
      defineConfig({
        sourceColor: '#6750A4',
        plugins: [
          new FontPlugin({}),
          new TailwindPlugin({ darkMode: 'media' }),
        ],
      }),
    );
    const resolved = await buildResolvedCss(css, [
      'bg-surface',
      'text-on-surface',
    ]);
    const server = createThemeFixtureServer(resolved);
    const port = await listen(server);
    const page = await browser.newPage({ colorScheme: 'dark' });

    try {
      await page.addInitScript(() => {
        window.__udxPaintSamples = [];

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (
              entry.name !== 'first-paint' &&
              entry.name !== 'first-contentful-paint'
            ) {
              continue;
            }

            const body = document.body;
            const probe = document.querySelector('#probe');
            if (!body || !probe) continue;

            const rootStyle = getComputedStyle(document.documentElement);
            const bodyStyle = getComputedStyle(body);
            const probeStyle = getComputedStyle(probe);

            window.__udxPaintSamples.push({
              name: entry.name,
              prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
              hasThemeOverrideClass:
                document.documentElement.classList.contains('dark') ||
                document.documentElement.classList.contains('light') ||
                body.classList.contains('dark') ||
                body.classList.contains('light'),
              hasScript: document.scripts.length > 0,
              bodyBackground: bodyStyle.backgroundColor,
              bodyText: bodyStyle.color,
              probeBackground: probeStyle.backgroundColor,
              probeText: probeStyle.color,
              lightSurface: rootStyle
                .getPropertyValue('--udx-light-surface')
                .trim(),
              darkSurface: rootStyle
                .getPropertyValue('--udx-dark-surface')
                .trim(),
              lightOnSurface: rootStyle
                .getPropertyValue('--udx-light-on-surface')
                .trim(),
              darkOnSurface: rootStyle
                .getPropertyValue('--udx-dark-on-surface')
                .trim(),
            });
          }
        }).observe({ type: 'paint', buffered: true });
      });

      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
      await page.waitForFunction(() =>
        window.__udxPaintSamples.some(
          ({ name }) => name === 'first-contentful-paint',
        ),
      );

      const paintSamples = await page.evaluate(() => window.__udxPaintSamples);
      const firstPaint = paintSamples.find(
        ({ name }) => name === 'first-paint',
      );
      const firstContentfulPaint = paintSamples.find(
        ({ name }) => name === 'first-contentful-paint',
      );

      if (!firstPaint || !firstContentfulPaint) {
        throw new Error('Chromium did not report both first paint events');
      }

      for (const paint of [firstPaint, firstContentfulPaint]) {
        expect(paint.prefersDark).toBe(true);
        expect(paint.bodyBackground).toBe(hexToRgb(paint.darkSurface));
        expect(paint.bodyText).toBe(hexToRgb(paint.darkOnSurface));
        expect(paint.probeBackground).toBe(hexToRgb(paint.darkSurface));
        expect(paint.probeText).toBe(hexToRgb(paint.darkOnSurface));
        expect(paint.hasThemeOverrideClass).toBe(false);
        expect(paint.hasScript).toBe(false);
      }

      const dark = await readThemeColors(page);

      expect(dark.prefersDark).toBe(true);
      expect(dark.bodyBackground).toBe(hexToRgb(dark.darkSurface));
      expect(dark.bodyText).toBe(hexToRgb(dark.darkOnSurface));
      expect(dark.probeBackground).toBe(hexToRgb(dark.darkSurface));
      expect(dark.probeText).toBe(hexToRgb(dark.darkOnSurface));
      expect(dark.hasThemeOverrideClass).toBe(false);
      expect(dark.hasScript).toBe(false);

      await page.emulateMedia({ colorScheme: 'light' });

      const light = await readThemeColors(page);

      expect(light.prefersDark).toBe(false);
      expect(light.bodyBackground).toBe(hexToRgb(light.lightSurface));
      expect(light.bodyText).toBe(hexToRgb(light.lightOnSurface));
      expect(light.probeBackground).toBe(hexToRgb(light.lightSurface));
      expect(light.probeText).toBe(hexToRgb(light.lightOnSurface));
      expect(light.hasThemeOverrideClass).toBe(false);
      expect(light.hasScript).toBe(false);
      expect(light.bodyBackground).not.toBe(dark.bodyBackground);
      expect(light.bodyText).not.toBe(dark.bodyText);
    } finally {
      await page.close();
      await close(server);
    }
  });
});

function createThemeFixtureServer(css: string): Server {
  return createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;

    if (pathname === '/') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(`
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width">
            <link rel="stylesheet" href="/theme.css">
          </head>
          <body>
            <main id="probe" class="bg-surface text-on-surface">Udixio</main>
          </body>
        </html>
      `);
      return;
    }

    if (pathname === '/theme.css') {
      // Keep the stylesheet as a real, render-blocking request during navigation.
      setTimeout(() => {
        response.writeHead(200, { 'content-type': 'text/css; charset=utf-8' });
        response.end(css);
      }, 100);
      return;
    }

    response.writeHead(404);
    response.end();
  });
}

function listen(server: Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      resolve(address.port);
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function readThemeColors(
  page: import('playwright').Page,
): Promise<ThemeSnapshot> {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    const probe = getComputedStyle(document.querySelector('#probe')!);

    return {
      prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
      hasThemeOverrideClass:
        document.documentElement.classList.contains('dark') ||
        document.documentElement.classList.contains('light') ||
        document.body.classList.contains('dark') ||
        document.body.classList.contains('light'),
      hasScript: document.scripts.length > 0,
      bodyBackground: body.backgroundColor,
      bodyText: body.color,
      probeBackground: probe.backgroundColor,
      probeText: probe.color,
      lightSurface: root.getPropertyValue('--udx-light-surface').trim(),
      darkSurface: root.getPropertyValue('--udx-dark-surface').trim(),
      lightOnSurface: root.getPropertyValue('--udx-light-on-surface').trim(),
      darkOnSurface: root.getPropertyValue('--udx-dark-on-surface').trim(),
    };
  });
}

function hexToRgb(hex: string): string {
  const match = /^#([\da-f]{6})$/i.exec(hex);
  if (!match) {
    throw new Error(`Expected a six-digit hex color, received "${hex}"`);
  }

  const value = Number.parseInt(match[1], 16);
  const red = (value >> 16) & 0xff;
  const green = (value >> 8) & 0xff;
  const blue = value & 0xff;

  return `rgb(${red}, ${green}, ${blue})`;
}
