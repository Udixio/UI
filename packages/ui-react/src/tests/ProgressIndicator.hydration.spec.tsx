import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ProgressIndicator } from '../lib/components/ProgressIndicator.js';

describe('ProgressIndicator hydration', () => {
  it.each(['linear-indeterminate', 'circular-indeterminate'] as const)(
    'hydrates %s without replacing the named server indicator in reduced motion',
    async (variant) => {
      const element = (
        <>
          <span id="progress-name">Loading</span>
          <ProgressIndicator
            variant={variant}
            value={100}
            aria-labelledby="progress-name"
            aria-valuenow={100}
          />
        </>
      );
      const container = document.createElement('div');
      container.innerHTML = renderToString(element);
      document.body.append(container);
      const progress = container.querySelector('[role="progressbar"]')!;
      const children = [...progress.querySelectorAll('*')];
      const errors: unknown[] = [];
      document.documentElement.setAttribute('data-motion-policy', 'reduce');
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation((...args) => errors.push(args));
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, element, {
            onRecoverableError: (error) => errors.push(error),
          });
        });
        expect(container.querySelector('[role="progressbar"]')).toBe(progress);
        expect([...progress.querySelectorAll('*')]).toEqual(children);
        expect(progress.getAttribute('aria-labelledby')).toBe('progress-name');
        expect(progress.hasAttribute('aria-valuenow')).toBe(false);
        expect(errors).toEqual([]);
      } finally {
        await act(async () => root?.unmount());
        consoleError.mockRestore();
        document.documentElement.removeAttribute('data-motion-policy');
        container.remove();
      }
    },
  );
});
