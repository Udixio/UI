import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import SideSheet from './SideSheet.svelte';

describe('SideSheet', () => {
  afterEach(cleanup);

  it('renders standard content and requests close', async () => {
    const onOpenChange = vi.fn();
    render(SideSheet, { props: { title: 'Filters', onOpenChange, children: undefined } });
    expect(screen.getByText('Filters')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Close Filters' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('uses distinct title ids for multiple labelled sheets', () => {
    render(SideSheet, { props: { title: 'First sheet', children: undefined } });
    render(SideSheet, { props: { title: 'Second sheet', children: undefined } });

    const titles = Array.from(document.querySelectorAll('p[id^="side-sheet-title-"]')).map((title) => title.id);
    expect(new Set(titles).size).toBe(2);
  });
});
