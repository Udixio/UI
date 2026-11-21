import { compile } from 'tailwindcss';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { classNames } from '../utils/styles/classnames';
import { iconButtonStyle } from './icon-button.style';
import { snackbarStyle } from './snackbar.style';

/**
 * The close icon of a snackbar in a real browser, under the light and the dark scheme. The classes come from the core
 * styles (the snackbar's own, and the icon button's, merged the way the adapters merge them), compiled with Tailwind v4.
 * The colour aliases mirror what the Udixio Tailwind plugin emits (packages/tailwind/src/browser/tailwind.plugin.ts): each
 * `--color-x` resolves through a toggle that `.dark` and `.light` boundaries set, so an element carrying `dark` takes the
 * dark palette whatever scheme surrounds it. The placeholder values are M3 baseline tones: the relation between the two
 * schemes is what the contrast depends on.
 */
const PALETTE = {
  'inverse-surface': { light: '#313033', dark: '#e6e1e5' },
  'inverse-on-surface': { light: '#f4eff4', dark: '#313033' },
  'on-surface-variant': { light: '#49454f', dark: '#cac4d0' },
} as const;
const KEYS = Object.keys(PALETTE) as (keyof typeof PALETTE)[];

const THEME = `@theme {
  ${KEYS.map((key) => `--color-${key}: var(--udx-${key}-dark-on, var(--udx-light-${key}));`).join('\n  ')}
}
@tailwind utilities;`;

const PLUGIN_CSS = `
:root {
  ${KEYS.map((key) => `--udx-light-${key}: ${PALETTE[key].light}; --udx-dark-${key}: ${PALETTE[key].dark};`).join('\n  ')}
}
:is(:root, .light, .dark) {
  ${KEYS.map((key) => `--udx-${key}-dark-on: var(--udx-on-dark) var(--udx-dark-${key}); --color-${key}: var(--udx-${key}-dark-on, var(--udx-light-${key}));`).join('\n  ')}
}
.dark { --udx-on-dark: ; }
.light { --udx-on-dark: initial; }
`;

type IconButtonState = Parameters<typeof iconButtonStyle>[0];

/** The close button as the React, Angular and Svelte snackbars render it: its default classes, then the snackbar's icon classes. */
function closeButtonClasses(): string {
  const defaults = iconButtonStyle({
    variant: 'standard',
    size: 'medium',
    shape: 'rounded',
    shapeFeedback: 'morph',
    width: 'default',
    disabled: false,
    isPressed: false,
    toggleable: false,
    className: undefined,
  } as IconButtonState).iconButton;
  return classNames(defaults, snackbarStyle({ message: 'Saved', isOpen: true, className: undefined } as Parameters<typeof snackbarStyle>[0]).icon);
}

/** The relative luminance of an `rgb()` or `rgba()` colour, as WCAG defines it. */
function luminance(color: string): number {
  const [red, green, blue] = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map((channel) => {
    const value = Number(channel) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** The WCAG contrast ratio of two colours, from 1 to 21. */
function contrast(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

/** A snackbar inside a scheme boundary, with its close icon and a 24 px glyph that is painted in the icon colour. */
function mountSnackbar(scheme: 'light' | 'dark') {
  const snackbar = snackbarStyle({ message: 'Saved', isOpen: true, className: undefined } as Parameters<typeof snackbarStyle>[0]);
  document.body.innerHTML = `
    <div class="${scheme}">
      <div id="snackbar" class="${snackbar.snackbar}">
        <div class="${snackbar.container}">
          <p id="text" class="${snackbar.supportingText}">Saved</p>
          <button type="button" id="close" class="${closeButtonClasses()}">
            <span id="glyph" style="display: block; width: 24px; height: 24px; background-color: currentColor"></span>
          </button>
        </div>
      </div>
    </div>
  `;
  return {
    surface: getComputedStyle(document.querySelector<HTMLElement>('#snackbar')!).backgroundColor,
    icon: getComputedStyle(document.querySelector<HTMLElement>('#glyph')!).backgroundColor,
    text: getComputedStyle(document.querySelector<HTMLElement>('#text')!).color,
  };
}

describe('snackbar colours in the browser', () => {
  beforeAll(async () => {
    const compiler = await compile(THEME);
    const style = document.createElement('style');
    style.textContent = `${compiler.build([...new Set(snackbarCandidates())])}\n${PLUGIN_CSS}`;
    document.head.append(style);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each(['light', 'dark'] as const)('the close icon keeps 3:1 against the snackbar surface in the %s scheme (WCAG 1.4.11)', (scheme) => {
    const { surface, icon } = mountSnackbar(scheme);

    expect(contrast(icon, surface)).toBeGreaterThanOrEqual(3);
  });

  it.each(['light', 'dark'] as const)('the supporting text keeps 4.5:1 against the snackbar surface in the %s scheme (WCAG 1.4.3)', (scheme) => {
    const { surface, text } = mountSnackbar(scheme);

    expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
  });
});

/** Every class the snackbar and its close button can receive, so that Tailwind builds each of them. */
function snackbarCandidates(): string[] {
  const snackbar = snackbarStyle({ message: 'Saved', isOpen: true, className: undefined } as Parameters<typeof snackbarStyle>[0]);
  return Object.values(snackbar).flatMap((value) => value.split(/\s+/)).concat(closeButtonClasses().split(/\s+/)).filter(Boolean);
}
