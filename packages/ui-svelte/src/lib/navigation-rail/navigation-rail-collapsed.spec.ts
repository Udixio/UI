import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Fixture from './navigation-rail-collapsed.fixture.svelte';

describe('NavigationRail collapsed', () => {
  it('keeps the section label and the item after it in the DOM, hidden', () => {
    render(Fixture);

    expect(screen.getByText('Sleep well')).toBeInTheDocument();
    expect(screen.getByText('Sleep well')).not.toBeVisible();
    expect(
      screen.getAllByText('Schedule')[0].closest('button'),
    ).toHaveAttribute('hidden');
    expect(
      screen.getAllByText('Alarm')[0].closest('button'),
    ).not.toHaveAttribute('hidden');
  });
});
