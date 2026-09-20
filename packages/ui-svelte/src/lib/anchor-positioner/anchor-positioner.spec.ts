import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { createAnchorPositionerController } from '@udixio/core/dom';
import AnchorPositioner from './AnchorPositioner.svelte';

const controller = {
  update: vi.fn(),
  destroy: vi.fn(),
};

vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createAnchorPositionerController: vi.fn(() => controller),
  };
});

describe('AnchorPositioner', () => {
  afterEach(() => {
    cleanup();
    controller.update.mockClear();
    controller.destroy.mockClear();
    vi.mocked(createAnchorPositionerController).mockClear();
  });

  it('portals its floating element, updates its controller, and cleans up on unmount', async () => {
    const anchor = document.createElement('button');
    document.body.append(anchor);

    const { rerender } = render(AnchorPositioner, {
      props: {
        anchor,
        children: undefined,
        'data-testid': 'floating',
      },
    });
    flushSync();

    const floating = screen.getByTestId('floating');
    expect(floating.parentElement).toBe(document.body);
    expect(floating).toHaveStyle({ zIndex: '50' });
    expect(createAnchorPositionerController).toHaveBeenCalledWith(
      expect.objectContaining({
        anchor,
        floating,
        position: expect.any(Function),
      }),
    );

    await rerender({ anchor, position: 'top', children: undefined, 'data-testid': 'floating' });
    flushSync();
    expect(controller.update).toHaveBeenCalled();

    cleanup();
    expect(controller.destroy).toHaveBeenCalledOnce();
    expect(document.body.contains(floating)).toBe(false);
  });
});
