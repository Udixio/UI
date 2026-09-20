import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import Fixture from './tabs.fixture.svelte';

describe('Tabs family', () => {
  afterEach(cleanup);

  it('connects tabs and panels with accessible ids', async () => {
    render(Fixture);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('First panel');
    await fireEvent.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Second panel');
    expect(tabs[1]).toHaveAttribute('aria-controls');
  });

  it('uses distinct tab-group ids for multiple independent groups', () => {
    render(Fixture);
    render(Fixture);

    const ids = screen.getAllByRole('tab').map((tab) => tab.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
