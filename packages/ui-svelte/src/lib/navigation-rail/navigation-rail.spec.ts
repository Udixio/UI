import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
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

  it('rests on its collapsed bounds, and takes the extended ones through the shared width controller', async () => {
    const { container } = render(NavigationRail, { props: { children: undefined } });
    const rail = container.querySelector<HTMLElement>('.navigation-rail')!;
    expect(rail.style.minWidth).toBe('96px');
    expect(rail.style.maxWidth).toBe('96px');

    await fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await tick();
    expect(rail.style.minWidth).toBe('220px');
    expect(rail.style.maxWidth).toBe('360px');
  });
});
