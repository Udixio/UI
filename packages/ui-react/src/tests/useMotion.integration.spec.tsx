import '@udixio/motion/presets';
import { act } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { defineMotion, getMotion, getMotions } from '@udixio/motion';
import { press } from '@udixio/motion/presets';
import { Motion } from '../lib/index.js';
import { useMotion, type UseMotionReturn } from '../lib/hooks/useMotion.js';

function Panel({ source }: { source: string }) {
  const panel = useMotion(source);
  return panel.mounted && <div data-testid="box" ref={panel.ref} />;
}

describe('useMotion with the real motion core', () => {
  it('binds a defined motion on mount', async () => {
    const { getByTestId } = render(<Panel source="fade" />);

    await act(async () => {});

    expect(getByTestId('box').getAttribute('data-motion-presence')).toBe('present');
  });

  it('renders an undefined name without throwing and without binding it', async () => {
    const { getByTestId } = render(<Panel source="use-motion-later" />);

    await act(async () => {});

    expect(getByTestId('box').hasAttribute('data-motion-presence')).toBe(false);
  });

  it('play() replays a reveal bound by name, through its core binding', async () => {
    let panel: UseMotionReturn<HTMLDivElement> | undefined;
    function Revealed() {
      panel = useMotion<HTMLDivElement>('rise');
      return panel.mounted && <div data-testid="box" ref={panel.ref} />;
    }
    render(<Revealed />);
    await act(async () => {});
    const reveal = panel?.getBinding('view');
    expect(reveal?.verb).toBe('reveal');
    const replay = vi.spyOn(reveal!, 'play');

    act(() => panel?.play());

    expect(replay).toHaveBeenCalledTimes(1);
  });

  it('a play() asked before its name is defined plays once the motion is defined', async () => {
    let panel: UseMotionReturn<HTMLDivElement> | undefined;
    function Waiting() {
      panel = useMotion<HTMLDivElement>(['use-motion-wait-press', 'fade']);
      return panel.mounted && <div data-testid="box" ref={panel.ref} />;
    }
    render(<Waiting />);
    await act(async () => {});
    expect(panel?.play()).toBeUndefined();
    expect(panel?.getBinding('emphasis')).toBeUndefined();

    act(() => defineMotion('use-motion-wait-press', press.spec));

    const emphasis = panel?.getBinding('emphasis');
    expect(emphasis?.verb).toBe('emphasize');
    expect(emphasis?.handle).not.toBeNull();
    expect(panel?.getBinding()).toBe(emphasis);
  });

  it('replays a reveal bound by name when state changes, as play() does', async () => {
    let panel: UseMotionReturn<HTMLDivElement> | undefined;
    function Stateful({ state }: { state: number }) {
      panel = useMotion<HTMLDivElement>('rise', { state });
      return panel.mounted && <div data-testid="box" ref={panel.ref} />;
    }
    const { rerender } = render(<Stateful state={0} />);
    await act(async () => {});
    const replay = vi.spyOn(panel!.getBinding('view')!, 'play');

    rerender(<Stateful state={1} />);

    expect(replay).toHaveBeenCalledTimes(1);
  });

  it('reports a misspelt name in development, from the hook and from Motion', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      render(<Panel source="use-motion-misspelt" />);
      render(<Motion name="motion-misspelt" />);
      await act(async () => {});

      expect(error).toHaveBeenCalledWith(expect.stringContaining('Unknown motion "use-motion-misspelt"'));
      expect(error).toHaveBeenCalledWith(expect.stringContaining('Unknown motion "motion-misspelt"'));
    } finally {
      error.mockRestore();
    }
  });

  it('binds one motion of each kind from a list, the first listed, and reports the others in development', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let panel: UseMotionReturn<HTMLDivElement> | undefined;
    function Listed() {
      panel = useMotion<HTMLDivElement>(['fade', 'slide', 'press', 'shake']);
      return panel.mounted && <div data-testid="box" ref={panel.ref} />;
    }
    try {
      const { getByTestId } = render(<Listed />);
      await act(async () => {});
      const box = getByTestId('box');

      expect(getMotions(box)).toHaveLength(2);
      expect(panel?.getBinding('presence')).toBe(getMotion(box, 'presence'));
      expect(panel?.getBinding('emphasis')).toBe(getMotion(box, 'emphasis'));
      expect(error).toHaveBeenCalledWith(expect.stringContaining('"slide" ignored on an element that already has a presence motion ("fade")'));
    } finally {
      error.mockRestore();
    }
  });
});

describe('a split text that React renders again', () => {
  defineMotion('react-split-line', {
    verb: 'appear',
    split: 'words',
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
  });
  const LINES = ['Every word arrives in turn', 'The light comes in slowly', 'Let it settle'];

  function Lyric({ line }: { line: number }) {
    return (
      <Motion as="p" data-testid="lyric" name="react-split-line" state={line}>
        {LINES[line]}
      </Motion>
    );
  }

  const piecesOf = (element: HTMLElement) =>
    Array.from(element.querySelectorAll('[data-udx-piece]'), (piece) => piece.textContent);
  const sourceOf = (element: HTMLElement) => element.querySelector('[data-udx-split-source]')?.textContent;

  it('cuts each new line React renders, and its accessible copy follows', async () => {
    const { getByTestId, rerender } = render(<Lyric line={0} />);
    await act(async () => {});
    const lyric = getByTestId('lyric');
    rerender(<Lyric line={1} />);
    await vi.waitFor(() => expect(piecesOf(lyric)).toEqual(LINES[1].split(' ')));
    for (const line of [2, 0]) {
      rerender(<Lyric line={line} />);
      await act(async () => {});
      expect(piecesOf(lyric)).toEqual(LINES[line].split(' '));
      expect(sourceOf(lyric)).toBe(LINES[line]);
      expect(lyric.querySelectorAll('[data-udx-split]')).toHaveLength(1);
    }
  });
});
