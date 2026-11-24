/**
 * TRIAL (review 5, Q3): `<Motion as={Component}>` animates a component with no wrapper box. It renders a
 * `<span style="display: contents">` around the component, and the core rule of an element with no box binds the
 * component's first element child: its root.
 */
import '@udixio/motion/presets';
import { act, createRef } from 'react';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getMotion } from '@udixio/motion';
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
    expect(card.hasAttribute('data-motion-presence')).toBe(true);
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

  it('renders the wrapper on the server around the component markup', () => {
    const html = renderToString(<Motion as={Button} name="press" label="Save" />);
    expect(html.startsWith('<span style="display:contents"><button')).toBe(true);
  });
});
