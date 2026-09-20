import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MenuHeadline from './MenuHeadline.svelte';

describe('MenuHeadline', () => {
  it('renders presentational text', () => {
    render(MenuHeadline, { props: { label: 'Recent' } });
    expect(screen.getByText('Recent')).toHaveAttribute('role', 'presentation');
  });
});
