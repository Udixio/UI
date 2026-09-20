import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NavigationRailItem from './NavigationRailItem.svelte';
import { iHome } from '@udixio/icons-rounded-400/home';

describe('NavigationRailItem', () => {
  it('renders its label and icon', () => {
    render(NavigationRailItem, { props: { label: 'Home', icon: iHome, iconSelected: iHome } });
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });
});
