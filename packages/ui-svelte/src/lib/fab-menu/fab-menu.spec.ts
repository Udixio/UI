import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { iAdd } from '@udixio/icons-rounded-400/add';
import FabMenu from './FabMenu.svelte';

describe('FabMenu', () => {
  afterEach(cleanup);

  it('renders a labelled trigger and opens its action group', async () => {
    render(FabMenu, { props: { label: 'Create', icon: iAdd, actions: [{ id: 'new', label: 'New' }] } });
    const trigger = screen.getByRole('button', { name: 'Create' });
    expect(trigger).toBeInTheDocument();
    await fireEvent.click(trigger);
    expect(screen.getByRole('group', { name: 'Create actions' })).toBeInTheDocument();
  });

  it('uses distinct controlled-by ids for multiple instances', () => {
    render(FabMenu, { props: { label: 'First', icon: iAdd, actions: [] } });
    render(FabMenu, { props: { label: 'Second', icon: iAdd, actions: [] } });

    const controls = screen.getAllByRole('button').map((button) => button.getAttribute('aria-controls'));
    expect(controls.filter(Boolean)).toHaveLength(2);
    expect(new Set(controls.filter(Boolean)).size).toBe(2);
  });
});
