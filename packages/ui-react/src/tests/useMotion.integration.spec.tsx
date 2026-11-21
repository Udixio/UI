import '@udixio/motion/presets';
import { act } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
});
