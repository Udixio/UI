import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import Snackbar from './Snackbar.svelte';

describe('Snackbar', () => {
  afterEach(cleanup);

  it('announces its message and closes through the callback', async () => {
    const onOpenChange = vi.fn();
    render(Snackbar, { props: { message: 'Saved', onOpenChange } });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    await fireEvent.click(screen.getByRole('button', { name: 'Close the snackbar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('paints the close icon and its state layer with the inverse on-surface token of the current scheme', () => {
    render(Snackbar, { props: { message: 'Saved' } });
    const closeButton = screen.getByRole('button', { name: 'Close the snackbar' });

    // Regression: a `dark` class on the icon forced the dark palette onto it in the light theme.
    expect(closeButton).toHaveClass('text-inverse-on-surface');
    expect(closeButton).not.toHaveClass('dark');
    const stateLayer = closeButton.querySelector<HTMLElement>('span[aria-hidden="true"]');
    expect(stateLayer!.style.getPropertyValue('--state-color')).toContain('var(--color-inverse-on-surface');
  });
});
