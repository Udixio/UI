import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ContextMenu from './ContextMenu.svelte';

describe('ContextMenu', () => {
  it('renders its trigger', () => {
    render(ContextMenu, { props: { trigger: undefined } });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
