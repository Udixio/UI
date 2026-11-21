import { compile } from 'tailwindcss';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { checkboxStyle } from './checkbox.style';

/**
 * The checkbox drawn by its classes alone, in a real browser: each state's classes are compiled with Tailwind v4 (a
 * placeholder palette) and mounted the way the server renders them, with no script. The box's fill and border, and the
 * check mark, are read from the computed styles. The native input is the only source of the checked state: a click on it,
 * made with no component, changes what is drawn.
 */
const THEME = `@theme {
  --color-primary: #6750a4;
  --color-on-primary: #ffffff;
  --color-on-surface: #1d1b20;
  --color-on-surface-variant: #49454f;
  --color-surface: #fef7ff;
  --color-error: #b3261e;
  --color-on-error: #ffffff;
}
@tailwind utilities;`;

const NONE = 'rgba(0, 0, 0, 0)';
const PRIMARY = 'rgb(103, 80, 164)';
const ON_SURFACE = 'rgb(29, 27, 32)';
const ON_SURFACE_VARIANT = 'rgb(73, 69, 79)';
const ERROR = 'rgb(179, 38, 30)';

type CheckboxState = Parameters<typeof checkboxStyle>[0];
type Options = Partial<Pick<CheckboxState, 'indeterminate' | 'disabled' | 'invalid'>>;

/** The classes of a checkbox in the given state, as the adapters pass them to the style. */
function classesOf(options: Options) {
  return checkboxStyle({
    checked: false,
    defaultChecked: false,
    indeterminate: false,
    disabled: false,
    invalid: false,
    id: 'updates',
    name: undefined,
    value: undefined,
    required: false,
    isChecked: false,
    isFocused: false,
    className: undefined,
    ...options,
  } as CheckboxState);
}

/** The markup the adapters render: the native input, then the box and the check mark. */
function mount(options: Options, checked: boolean): HTMLElement {
  const styles = classesOf(options);
  const root = document.createElement('div');
  root.className = styles.checkbox;
  root.innerHTML = [
    `<input type="checkbox" class="${styles.input}"${checked ? ' checked' : ''}${options.disabled ? ' disabled' : ''}>`,
    `<span aria-hidden="true" data-part="box" class="${styles.box}"></span>`,
    `<span aria-hidden="true" data-part="icon" class="${styles.icon}"><svg viewBox="0 -960 960 960"><path d="M0 0h10v10z"/></svg></span>`,
  ].join('');
  document.body.append(root);
  // The box eases its colours over 200 ms: the test reads the colour it settles on, not a frame of the transition.
  (root.querySelector('[data-part="box"]') as HTMLElement).style.transition = 'none';
  return root;
}

/** What is drawn: the fill and the border of the box, and whether the check mark is displayed. */
function drawn(root: HTMLElement) {
  const box = getComputedStyle(root.querySelector('[data-part="box"]')!);
  const icon = getComputedStyle(root.querySelector('[data-part="icon"]')!);
  return { fill: box.backgroundColor, border: box.borderTopColor, mark: icon.display };
}

const states: { name: string; options: Options; checked: boolean; expected: ReturnType<typeof drawn> }[] = [
  { name: 'unchecked', options: {}, checked: false, expected: { fill: NONE, border: ON_SURFACE_VARIANT, mark: 'none' } },
  { name: 'checked', options: {}, checked: true, expected: { fill: PRIMARY, border: PRIMARY, mark: 'flex' } },
  {
    name: 'indeterminate, with the input unchecked',
    options: { indeterminate: true },
    checked: false,
    expected: { fill: PRIMARY, border: PRIMARY, mark: 'flex' },
  },
  { name: 'disabled and unchecked', options: { disabled: true }, checked: false, expected: { fill: NONE, border: ON_SURFACE, mark: 'none' } },
  { name: 'disabled and checked', options: { disabled: true }, checked: true, expected: { fill: ON_SURFACE, border: ON_SURFACE, mark: 'flex' } },
  { name: 'invalid and unchecked', options: { invalid: true }, checked: false, expected: { fill: NONE, border: ERROR, mark: 'none' } },
  { name: 'invalid and checked', options: { invalid: true }, checked: true, expected: { fill: ERROR, border: ERROR, mark: 'flex' } },
];

describe('checkbox drawn by its classes in the browser', () => {
  beforeAll(async () => {
    const compiler = await compile(THEME);
    const candidates = [{}, ...states.map((state) => state.options)]
      .flatMap((options) => Object.values(classesOf(options)).join(' ').split(/\s+/))
      .filter(Boolean);
    const style = document.createElement('style');
    style.textContent = compiler.build([...new Set(candidates)]);
    document.head.append(style);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  for (const state of states) {
    it(`draws the ${state.name} state from the native input, with no script`, () => {
      const root = mount(state.options, state.checked);
      expect(drawn(root)).toEqual(state.expected);
    });
  }

  it('follows a native click with no component: the box fills, then empties on the next click', () => {
    const root = mount({}, false);
    const input = root.querySelector('input')!;

    input.click();
    expect(input.checked).toBe(true);
    expect(drawn(root)).toEqual(states[1].expected);

    input.click();
    expect(input.checked).toBe(false);
    expect(drawn(root)).toEqual(states[0].expected);
  });

  it('keeps a disabled checkbox as drawn when it is clicked', () => {
    const root = mount({ disabled: true }, false);

    root.querySelector<HTMLInputElement>('input')!.click();
    expect(drawn(root)).toEqual(states[3].expected);
  });
});
