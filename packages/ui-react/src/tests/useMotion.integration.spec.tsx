import '@udixio/motion/presets';
import { act } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Motion } from '../lib/index.js';
import { useMotion } from '../lib/hooks/useMotion.js';

function Panel({ source }: { source: string }) {
  const panel = useMotion(source);
  return panel.mounted && <div data-testid="box" ref={panel.ref} />;
}

describe('useMotion with the real motion core', () => {
  it('binds a defined motion on mount', async () => {
    const { getByTestId } = render(<Panel source="fade" />);

    await act(async () => {});

    expect(getByTestId('box').getAttribute('data-presence')).toBe('present');
  });

  it('renders an undefined name without throwing and without binding it', async () => {
    const { getByTestId } = render(<Panel source="use-motion-later" />);

    await act(async () => {});

    expect(getByTestId('box').hasAttribute('data-presence')).toBe(false);
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
