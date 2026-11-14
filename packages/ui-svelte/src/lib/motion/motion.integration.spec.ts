import { afterEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import '@udixio/motion/presets';
import Fixture from './motion.fixture.svelte';

describe('motion attachment with the real core', () => {
  afterEach(() => {
    cleanup();
  });

  it('binds a defined motion and ends present', async () => {
    render(Fixture, { props: { source: 'fade' } });
    flushSync();
    await Promise.resolve();

    expect(screen.getByTestId('box')).toHaveAttribute('data-presence', 'present');
  });

  it('renders a motion that is not defined yet, without binding it', () => {
    render(Fixture, { props: { source: 'svelte-motion-later' } });
    flushSync();

    expect(screen.getByTestId('box')).not.toHaveAttribute('data-presence');
  });
});
