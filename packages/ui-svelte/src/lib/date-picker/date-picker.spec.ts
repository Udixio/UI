import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import DatePicker from './DatePicker.svelte';

describe('DatePicker', () => {
  afterEach(cleanup);

  it('renders a grid and reports a day selection', async () => {
    const onChange = vi.fn();
    render(DatePicker, { props: { onChange, value: new Date(2026, 8, 1) } });
    expect(screen.getByRole('grid')).toBeInTheDocument();
    const day = document.querySelector('[data-date]') as HTMLElement;
    expect(day).toBeTruthy();
    await fireEvent.click(day);
    expect(onChange).toHaveBeenCalled();
  });
});
