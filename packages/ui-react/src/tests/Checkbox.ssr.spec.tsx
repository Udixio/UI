import '@testing-library/jest-dom';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { Checkbox } from '../lib/index.js';

/**
 * A checkbox drawn by the server, before any script runs. Its box and check mark read the native input's `:checked` state
 * through the root's `group-has-[input:checked]` variants, so a click made on the input shows at once, with no re-render.
 */

/** Whether the native input of the checkbox is checked: the state that the variants of the root read. */
const inputChecked = (root: HTMLElement) => root.matches(':has(input:checked)');

function mount(markup: string) {
  document.body.innerHTML = markup;
  const root = document.querySelector<HTMLElement>('.checkbox');
  if (!root) throw new Error('the checkbox root is missing from the markup');
  return {
    root,
    input: root.querySelector('input') as HTMLInputElement,
    box: root.querySelector<HTMLElement>('.box'),
    icon: root.querySelector<HTMLElement>('.icon'),
  };
}

describe('Checkbox rendered on the server', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps the check mark in the markup of an unchecked checkbox, shown only while the native input is checked', () => {
    const { root, input, icon } = mount(renderToString(<Checkbox id="updates" />));

    expect(input.checked).toBe(false);
    expect(icon).not.toBeNull();
    expect(icon).toHaveClass('hidden', 'group-has-[input:checked]/checkbox:flex');
    expect(inputChecked(root)).toBe(false);

    input.checked = true;
    expect(inputChecked(root)).toBe(true);
  });

  it('fills the box from the native input, and empties it again on a native toggle back', () => {
    const { root, input, box } = mount(renderToString(<Checkbox />));

    expect(box).toHaveClass('group-has-[input:checked]/checkbox:bg-primary');
    input.checked = true;
    expect(inputChecked(root)).toBe(true);
    input.checked = false;
    expect(inputChecked(root)).toBe(false);
  });

  it('draws the checked and the indeterminate states from the markup itself, with no script', () => {
    const checked = mount(renderToString(<Checkbox defaultChecked />));
    expect(checked.input.checked).toBe(true);
    expect(checked.icon).not.toBeNull();

    const indeterminate = mount(renderToString(<Checkbox indeterminate />));
    expect(indeterminate.icon).toHaveClass('flex');
    expect(indeterminate.icon).not.toHaveClass('hidden');
    expect(indeterminate.box).toHaveClass('bg-primary');
  });
});
