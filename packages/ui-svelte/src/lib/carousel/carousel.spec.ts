import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import Fixture from './carousel.fixture.svelte';

describe('Carousel', () => {
  afterEach(cleanup);

  it('renders a named carousel with slide semantics', () => {
    render(Fixture);
    expect(screen.getByRole('region', { name: 'Featured' })).toHaveAttribute('aria-roledescription', 'carousel');
    expect(document.querySelectorAll('[role="group"][aria-roledescription="slide"]')).toHaveLength(2);
  });
});
