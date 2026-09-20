import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Fixture from './tabs.fixture.svelte';

describe('TabPanels', () => {
  it('renders a wrapper', () => {
    const { container } = render(Fixture);
    expect(container.querySelector('.tab-panels')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });
});
