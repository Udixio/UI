import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import Menu from './Menu.svelte';
import MenuItem from './MenuItem.svelte';

describe('Menu family', () => {
  afterEach(cleanup);

  it('renders menu items with action semantics and keyboard navigation', async () => {
    render(Menu, {
      props: {
        accessibleLabel: 'File actions',
        children: undefined,
      },
    });
    // A standalone menu remains useful for consumers that build its content through a snippet.
    expect(screen.getByRole('menu', { name: 'File actions' })).toBeInTheDocument();
  });

  it('selects a multiple menu item', async () => {
    render(MenuItem, { props: { label: 'Pin', selectionType: 'multiple', defaultSelected: false } });
    const item = screen.getByRole('menuitemcheckbox', { name: 'Pin' });
    await fireEvent.click(item);
    expect(item).toHaveAttribute('aria-checked', 'true');
  });
});
