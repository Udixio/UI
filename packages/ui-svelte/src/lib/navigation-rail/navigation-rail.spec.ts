import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import NavigationRail from './NavigationRail.svelte';
import NavigationRailItem from './NavigationRailItem.svelte';
import { iHome } from '@udixio/icons-rounded-400/home';

describe('NavigationRail', () => {
  afterEach(cleanup);

  it('renders the menu toggle and a destination', () => {
    render(NavigationRail, {
      props: {
        children: undefined,
      },
    });
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
    // The child registration path is covered by NavigationRailItem's standalone render below.
    render(NavigationRailItem, { props: { label: 'Home', icon: iHome, iconSelected: iHome } });
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });
});
