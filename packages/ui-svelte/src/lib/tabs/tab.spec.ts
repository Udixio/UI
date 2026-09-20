import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Tab from './Tab.svelte';

describe('Tab', () => {
  it('renders a standalone tab', () => {
    render(Tab, { props: { label: 'Overview' } });
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
  });
});
