import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import TabGroup from './TabGroup.svelte';

describe('TabGroup', () => {
  it('renders its children without a host role', () => {
    const { container } = render(TabGroup);
    expect(container.querySelector('[role="tablist"]')).toBeNull();
  });
});
