import { userEvent } from '@vitest/browser/context';
import { compile } from 'tailwindcss';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { buttonStyle } from './button.style';
import { chipStyle } from './chip.style';
import { chipsStyle } from './chips.style';
import { datePickerStyle } from './date-picker.style';
import { menuItemStyle } from './menu-item.style';
import { searchStyle } from './search.style';
import { textFieldStyle } from './text-field.style';

/**
 * Keyboard focus in a real browser: the classes of each style are compiled with Tailwind v4 (the utilities the core
 * styles use, with a placeholder palette), focused by a Tab press, and the computed outline, ring or border of the
 * element that shows the focus is read. A utility such as `outline-none` sets the variable that `focus-visible:outline-2`
 * reads, so the outline is not drawn on that element even when the focus-visible classes are present.
 */
const THEME = `@theme {
  --color-primary: #6750a4;
  --color-secondary: #625b71;
  --color-secondary-container: #e8def8;
  --color-on-secondary-container: #1d192b;
  --color-surface: #fef7ff;
  --color-surface-container: #f3edf7;
  --color-surface-container-high: #ece6f0;
  --color-surface-container-highest: #e6e0e9;
  --color-surface-container-low: #f7f2fa;
  --color-on-surface: #1d1b20;
  --color-on-surface-variant: #49454f;
  --color-outline: #79747e;
  --color-outline-variant: #cac4d0;
  --color-error: #b3261e;
}
@tailwind utilities;`;

type Props<T> = T extends (props: infer P) => unknown ? P : never;

interface Focusable {
  name: string;
  /** Markup of the element that takes the keyboard focus, after a `#before` button. */
  markup: string;
}

interface Container {
  name: string;
  /** Markup of a container whose state classes show the focus of the input inside it. */
  markup: string;
  /** Whether the container shows the focus of its input: an outline, a ring, or a 2 px border or more. */
  drawsFocus: (style: CSSStyleDeclaration) => boolean;
}

const buttonRoot = buttonStyle({ variant: 'filled', size: 'medium', shape: 'rounded' } as Props<typeof buttonStyle>).button;
const chip = chipStyle({ variant: 'filled', isInteractive: true, isFocused: true } as Props<typeof chipStyle>);
const chipLabel = chipStyle({ variant: 'filled', isEditing: true } as Props<typeof chipStyle>).label;
const chips = chipsStyle({ scrollable: false } as Props<typeof chipsStyle>).chips;
const menuItem = menuItemStyle({ variant: 'standard' } as Props<typeof menuItemStyle>).menuItem;
const dayButton = [
  buttonStyle({ variant: 'text', size: 'small', shape: 'rounded', shapeFeedback: 'none' } as Props<typeof buttonStyle>).button,
  datePickerStyle({ mode: 'single' } as Props<typeof datePickerStyle>).dayButton,
  'p-0',
].join(' ');
const search = searchStyle({ isFocused: true } as Props<typeof searchStyle>);
const searchInput = searchStyle({} as Props<typeof searchStyle>).input;
const textField = textFieldStyle({ variant: 'outlined', isFocused: true } as Props<typeof textFieldStyle>);
const textFieldInput = textFieldStyle({ variant: 'outlined' } as Props<typeof textFieldStyle>).input;

const focusables: Focusable[] = [
  { name: 'button (control)', markup: `<button type="button" class="${buttonRoot}">Action</button>` },
  { name: 'chip', markup: `<button type="button" class="${chip.chip}">Chip</button>` },
  { name: 'chip label while editing', markup: `<span contenteditable="true" class="${chipLabel}">Label</span>` },
  { name: 'chips with the input variant', markup: `<div role="list" tabindex="0" class="${chips}"></div>` },
  { name: 'menu item', markup: `<div role="menuitem" tabindex="0" class="${menuItem}">Item</div>` },
  { name: 'date picker day', markup: `<button type="button" class="${dayButton}">1</button>` },
];

const containers: Container[] = [
  {
    name: 'search (container outline while the input is focused)',
    markup: `<div class="${search.container}"><input class="${searchInput}" /></div>`,
    drawsFocus: (style) => drawnOutline(style),
  },
  {
    name: 'outlined text field (container border while the input is focused)',
    markup: `<div class="${textField.content}"><input class="${textFieldInput}" /></div>`,
    drawsFocus: (style) => parseFloat(style.borderTopWidth) >= 2,
  },
];

function drawnOutline(style: CSSStyleDeclaration): boolean {
  const transparent = style.outlineColor === 'rgba(0, 0, 0, 0)' || style.outlineColor === 'transparent';
  return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0 && !transparent;
}

/** An element shows a focus indicator when it draws an outline or a box-shadow ring. */
const drawsFocusRing = (style: CSSStyleDeclaration): boolean => drawnOutline(style) || style.boxShadow !== 'none';

const allCandidates = [
  ...focusables.map((item) => item.markup),
  ...containers.map((item) => item.markup),
]
  .flatMap((markup) => [...markup.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1].split(/\s+/)))
  .filter(Boolean);

async function focusByKeyboard(selector: string): Promise<HTMLElement> {
  const before = document.querySelector<HTMLElement>('#before');
  if (!before) throw new Error('missing #before');
  before.focus();
  await userEvent.tab();
  const target = document.querySelector<HTMLElement>(selector);
  expect(document.activeElement).toBe(target);
  return target!;
}

describe('focus indicator of the core styles in the browser', () => {
  beforeAll(async () => {
    const compiler = await compile(THEME);
    const style = document.createElement('style');
    style.textContent = compiler.build([...new Set(allCandidates)]);
    document.head.append(style);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each(focusables)('$name draws a focus indicator on keyboard focus', async ({ markup }) => {
    document.body.innerHTML = `<button type="button" id="before">Before</button>${markup}`;

    const target = await focusByKeyboard('#before + *');
    const style = getComputedStyle(target);

    expect(drawsFocusRing(style), JSON.stringify({ outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow })).toBe(true);
  });

  it.each(containers)('$name', async ({ markup, drawsFocus }) => {
    document.body.innerHTML = `<button type="button" id="before">Before</button>${markup}`;

    const input = await focusByKeyboard('#before + * input');
    const container = input.parentElement!;
    const style = getComputedStyle(container);

    expect(drawsFocus(style), JSON.stringify({ outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, borderTopWidth: style.borderTopWidth })).toBe(true);
  });
});
