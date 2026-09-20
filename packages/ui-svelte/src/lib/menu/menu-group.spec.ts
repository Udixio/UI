import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MenuGroup from './MenuGroup.svelte';

describe('MenuGroup', () => {
  it('names a labelled group', () => {
    render(MenuGroup, { props: { label: 'Actions' } });
    expect(screen.getByRole('group', { name: 'Actions' })).toBeInTheDocument();
  });

  it('uses distinct label ids for multiple groups', () => {
    render(MenuGroup, { props: { label: 'First' } });
    render(MenuGroup, { props: { label: 'Second' } });

    const ids = screen.getAllByRole('group').map((group) => group.getAttribute('aria-labelledby'));
    expect(new Set(ids).size).toBe(2);
  });
});
