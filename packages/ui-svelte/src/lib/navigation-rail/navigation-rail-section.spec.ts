import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NavigationRailSection from './NavigationRailSection.svelte';

describe('NavigationRailSection', () => {
  it('renders its label', () => {
    render(NavigationRailSection, { props: { label: 'Workspace' } });
    expect(screen.getByText('Workspace')).toBeInTheDocument();
  });
});
