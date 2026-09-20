import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import CarouselItem from './CarouselItem.svelte';

describe('CarouselItem', () => {
  it('renders projected content', () => {
    render(CarouselItem, { props: { children: undefined } });
    expect(screen.queryByRole('group')).toBeNull();
  });
});
