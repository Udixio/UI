import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import TabPanel from './TabPanel.svelte';

describe('TabPanel', () => {
  it('does not expose an unconnected inactive panel', () => {
    const { container } = render(TabPanel);
    expect(container.querySelector('[role="tabpanel"]')).toBeNull();
  });
});
