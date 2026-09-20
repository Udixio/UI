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
});
