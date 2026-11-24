/**
 * TRIAL (review 5, Q3): `<Motion as={Component}>` animates a component with no wrapper box. It renders a
 * `<span data-motion-box="child">` around the component, `display: contents` while it is shown, and the core rule of an
 * element with no box binds the component's first element child: its root. The wrapper carries the state (`hidden`, the
 * presence mark, `inert`), the root the pixels.
 */
import '@udixio/motion/presets';
import { act, createRef } from 'react';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getMotion } from '@udixio/motion';
import { defineGesture } from '@udixio/motion/gesture';
import { Button, Card, Motion, TextField, type MotionControls } from '../lib/index.js';

describe('<Motion as={Component}> (trial)', () => {
  it('binds a Button with no wrapper box: the motion is on its <button>, and its props reach it', async () => {
    const controls = createRef<MotionControls>();
    const { container, getByRole } = render(<Motion as={Button} name="press" label="Save" motionRef={controls} />);
    await act(async () => {});
    const button = getByRole('button', { name: 'Save' });
    const host = container.firstElementChild as HTMLElement;
    expect(host.tagName).toBe('SPAN');
    expect(host.style.display).toBe('contents');
    expect(host.firstElementChild).toBe(button);
    const binding = getMotion(button, 'emphasis');
    expect(binding?.verb).toBe('emphasize');
    expect(controls.current?.getBinding()).toBe(binding);
    const play = vi.spyOn(binding!, 'play');
    controls.current?.play();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('gives ref to the component, not to the wrapper', () => {
    const ref = createRef<HTMLButtonElement>();
    const { getByRole } = render(<Motion as={Button} name="press" label="Save" ref={ref} />);
    expect(ref.current).toBe(getByRole('button'));
  });

  it('replays the press on a change of state', async () => {
    const { rerender, getByRole } = render(<Motion as={Button} name="press" label="Save" state={0} />);
    await act(async () => {});
    const play = vi.spyOn(getMotion(getByRole('button'), 'emphasis')!, 'play');
    rerender(<Motion as={Button} name="press" label="Save" state={1} />);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('binds an appear on a Card: its root takes the presence', async () => {
    const { getByTestId } = render(
      <Motion as={Card} name="fade" data-testid="card">
        Body
      </Motion>,
    );
    await act(async () => {});
    const card = getByTestId('card');
    expect(card.parentElement?.style.display).toBe('contents');
    expect(getMotion(card, 'presence')).toBeDefined();
    // The wrapper, the element the author wrote, carries the state.
    expect(card.parentElement?.hasAttribute('data-motion-presence')).toBe(true);
    expect(card.hasAttribute('data-motion-presence')).toBe(false);
  });

  it('binds a shake on a TextField root, not on its input', async () => {
    const { container } = render(<Motion as={TextField} name="shake" label="Code" />);
    await act(async () => {});
    const host = container.firstElementChild as HTMLElement;
    const root = host.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(getMotion(root, 'emphasis')?.verb).toBe('emphasize');
    expect(getMotion(root.querySelector('input')!, 'emphasis')).toBeUndefined();
  });

  it('follows the root when the component renders another one: a Button that becomes a link', async () => {
    const { rerender, getByRole } = render(<Motion as={Button} name="press" label="Open" />);
    await act(async () => {});
    const before = getMotion(getByRole('button'), 'emphasis');
    rerender(<Motion as={Button} name="press" label="Open" href="/docs" />);
    await act(async () => {});
    const link = getByRole('link');
    expect(getMotion(link, 'emphasis')).toBeDefined();
    expect(getMotion(link, 'emphasis')).not.toBe(before);
  });

  it('raises no development warning: a Button, a Card and a TextField each render one root, the box', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      render(
        <>
          <Motion as={Button} name="press" label="Save" />
          <Motion as={Button} name="press" label="Open" href="/docs" />
          <Motion as={Card} name="fade">Body</Motion>
          <Motion as={TextField} name="shake" label="Code" />
        </>,
      );
      await act(async () => {});
      expect(warn.mock.calls.filter(([message]) => String(message).includes('data-motion-box'))).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });

  it('a component that renders several elements: development asks for the box to be marked, and the marked one is the box', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    function Pair({ mark }: { mark?: boolean }) {
      return (
        <>
          <i aria-hidden="true" />
          <b data-motion-box={mark ? '' : undefined}>Body</b>
        </>
      );
    }
    try {
      const { container } = render(<Motion as={Pair} name="press" />);
      await act(async () => {});
      expect(warn.mock.calls.filter(([message]) => String(message).includes('several children: mark the box with data-motion-box'))).toHaveLength(1);
      expect(getMotion(container.querySelector('i')!, 'emphasis')).toBeDefined();
      warn.mockClear();
      const marked = render(<Motion as={Pair} name="press" mark />);
      await act(async () => {});
      expect(warn.mock.calls.filter(([message]) => String(message).includes('data-motion-box'))).toEqual([]);
      expect(getMotion(marked.container.querySelector('b')!, 'emphasis')).toBeDefined();
    } finally {
      warn.mockRestore();
    }
  });

  it('leaves focus and the accessibility tree to the component: the wrapper takes no role and no tab stop', () => {
    const { container, getByRole } = render(<Motion as={Button} name="press" label="Save" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.getAttribute('role')).toBeNull();
    expect(host.tabIndex).toBe(-1);
    getByRole('button').focus();
    expect(document.activeElement).toBe(getByRole('button'));
  });

  it('renders the wrapper on the server around the component markup, declared with no box', () => {
    const html = renderToString(<Motion as={Button} name="press" label="Save" />);
    expect(html.startsWith('<span data-motion-box="child" style="display:contents"><button')).toBe(true);
  });
});

/** A `hidden` attribute in server HTML (not the `overflow-hidden` of a class). */
const HIDDEN_ATTRIBUTE = /\shidden(?==""|[\s>])/g;

describe('<Motion as={Component} present> (step C: the host carries the state, the box carries the pixels)', () => {
  it('renders an absent component hidden on the server: the wrapper is hidden, with no display: contents, and the component is not', () => {
    const html = renderToString(
      <Motion as={Card} name="fade" present={false}>
        Weekly report
      </Motion>,
    );
    expect(html.startsWith('<span data-motion-box="child" hidden=""><div')).toBe(true);
    expect(html).not.toContain('display:contents');
    expect(html).toContain('Weekly report');
    // The Card's own root is not asked to forward hidden.
    expect(html.match(HIDDEN_ATTRIBUTE)).toHaveLength(1);
  });

  it('renders a present component on the server with display: contents and no hidden', () => {
    const html = renderToString(
      <Motion as={Card} name="fade" present>
        Weekly report
      </Motion>,
    );
    expect(html.startsWith('<span data-motion-box="child" style="display:contents"><div')).toBe(true);
    expect(html.match(HIDDEN_ATTRIBUTE)).toBeNull();
  });

  it('keeps an author hidden prop for the component itself', () => {
    const html = renderToString(
      <Motion as={Card} name="fade" present hidden>
        Weekly report
      </Motion>,
    );
    expect(html.startsWith('<span data-motion-box="child" style="display:contents"><div')).toBe(true);
    expect(html.match(HIDDEN_ATTRIBUTE)).toHaveLength(1);
  });

  it('puts hidden, the presence mark and inert on the wrapper, the motion on the root, and shows the root again with its entry', async () => {
    const view = (open: boolean) => (
      <Motion as={Card} name="fade" present={open} data-testid="card">
        Weekly report
      </Motion>
    );
    const { getByTestId, rerender } = render(view(true));
    await act(async () => {});
    const card = getByTestId('card');
    const host = card.parentElement as HTMLElement;
    expect(host.getAttribute('data-motion-box')).toBe('child');
    expect(getMotion(host, 'presence')).toBe(getMotion(card, 'presence'));

    rerender(view(false));
    expect(host.hidden).toBe(true);
    expect(host.dataset.motionPresence).toBe('exiting');
    expect(host.hasAttribute('inert')).toBe(true);
    // Displayed while its exit plays.
    expect(host.style.display).toBe('contents');
    expect(card.hidden).toBe(false);
    expect(card.hasAttribute('data-motion-presence')).toBe(false);
    expect(card.hasAttribute('inert')).toBe(false);
    // Once the exit has ended, nothing gives the wrapper display: contents: hidden hides it.
    await vi.waitFor(() => expect(host.style.display).not.toBe('contents'));
    expect(host.hidden).toBe(true);
    expect(getComputedStyle(host).display).toBe('none');

    rerender(view(true));
    await act(async () => {});
    expect(host.hidden).toBe(false);
    expect(host.style.display).toBe('contents');
    expect(host.hasAttribute('inert')).toBe(false);
    expect(['entering', 'present']).toContain(host.dataset.motionPresence);
    expect(card.hasAttribute('data-motion-presence')).toBe(false);
  });

  it('binds a component absent from the start on its root, through the hidden wrapper', async () => {
    const { getByTestId } = render(
      <Motion as={Card} name="fade" present={false} data-testid="card">
        Weekly report
      </Motion>,
    );
    await act(async () => {});
    const card = getByTestId('card');
    const host = card.parentElement as HTMLElement;
    expect(host.hidden).toBe(true);
    expect(host.style.display).toBe('');
    expect(getMotion(card, 'presence')).toBeDefined();
    expect(host.dataset.motionPresence).toBe('exiting');
  });

  it('puts a gesture on the root: touch-action and the tabindex of its keyboard alternative, none on the wrapper', async () => {
    defineGesture('react-host-drag', { type: 'drag', alternative: 'arrows' });
    const { getByTestId } = render(
      <Motion as={Card} gesture="react-host-drag" data-testid="card">
        Drag me
      </Motion>,
    );
    await act(async () => {});
    await vi.waitFor(() => expect(getByTestId('card').getAttribute('tabindex')).toBe('0'));
    const card = getByTestId('card');
    const host = card.parentElement as HTMLElement;
    expect(card.style.touchAction).toBe('none');
    expect(host.hasAttribute('tabindex')).toBe(false);
    // jsdom keeps touch-action as a plain property: unset on the wrapper.
    expect(host.style.touchAction ?? '').toBe('');
  });
});
