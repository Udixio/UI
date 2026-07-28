import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import { Carousel, CarouselItem } from '../lib/index.js';

// jsdom lacks these; CustomScroll and Motion's scroll() need them to mount.
beforeAll(() => {
  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.assign(globalThis, {
    ResizeObserver: (globalThis as any).ResizeObserver ?? NoopObserver,
    IntersectionObserver:
      (globalThis as any).IntersectionObserver ?? NoopObserver,
  });
});

const renderCarousel = (
  count = 3,
  props: Partial<React.ComponentProps<typeof Carousel>> = {},
) =>
  render(
    <Carousel {...props}>
      {Array.from({ length: count }, (_, i) => (
        <CarouselItem key={i}>
          <div>Slide {i + 1}</div>
        </CarouselItem>
      ))}
    </Carousel>,
  );

const tabIndexes = (getAllByRole: ReturnType<typeof render>['getAllByRole']) =>
  getAllByRole('group', { hidden: true }).map((slide) =>
    slide.getAttribute('tabindex'),
  );

describe('Carousel', () => {
  it('exposes the carousel region role', () => {
    const { container } = renderCarousel();
    const region = container.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
  });

  it('renders only CarouselItem children and ignores the rest', () => {
    const { queryByText, getAllByRole } = render(
      <Carousel>
        <CarouselItem>
          <div>Real slide</div>
        </CarouselItem>
        <div>Not a slide</div>
        {'a bare string'}
      </Carousel>,
    );
    expect(queryByText('Real slide')).not.toBeNull();
    expect(queryByText('Not a slide')).toBeNull();
    expect(queryByText('a bare string')).toBeNull();
    expect(getAllByRole('group', { hidden: true })).toHaveLength(1);
  });

  it('gives each slide a group role and an "n / total" accessible name', () => {
    const { getAllByRole } = renderCarousel(3);
    const slides = getAllByRole('group', { hidden: true });
    expect(slides).toHaveLength(3);
    slides.forEach((slide, i) => {
      expect(slide).toHaveAttribute('aria-roledescription', 'slide');
      expect(slide).toHaveAttribute('aria-label', `${i + 1} / 3`);
    });
  });

  it('keeps a single slide in the tab order (roving tabindex)', () => {
    const { getAllByRole } = renderCarousel(3);
    const slides = getAllByRole('group', { hidden: true });
    expect(slides[0]).toHaveAttribute('tabindex', '0');
    expect(slides[1]).toHaveAttribute('tabindex', '-1');
    expect(slides[2]).toHaveAttribute('tabindex', '-1');
  });

  it('does not expose the removed aria-selected on slides', () => {
    const { getAllByRole } = renderCarousel(2);
    for (const slide of getAllByRole('group', { hidden: true })) {
      expect(slide).not.toHaveAttribute('aria-selected');
    }
  });

  it('handles arrow-key navigation without throwing', () => {
    const { container } = renderCarousel(3);
    const region = container.querySelector('[role="region"]') as HTMLElement;
    expect(() => {
      fireEvent.keyDown(region, { key: 'ArrowRight' });
      fireEvent.keyDown(region, { key: 'ArrowLeft' });
      fireEvent.keyDown(region, { key: 'Home' });
      fireEvent.keyDown(region, { key: 'End' });
    }).not.toThrow();
  });

  it('seeds the initial selection from defaultIndex when uncontrolled', () => {
    const { getAllByRole } = renderCarousel(3, { defaultIndex: 2 });
    expect(tabIndexes(getAllByRole)).toEqual(['-1', '-1', '0']);
  });

  it('renders the controlled index as the source of truth', () => {
    const { getAllByRole } = renderCarousel(3, { index: 1 });
    expect(tabIndexes(getAllByRole)).toEqual(['-1', '0', '-1']);
  });

  it('renders an empty carousel without throwing', () => {
    expect(() => render(<Carousel>{null}</Carousel>)).not.toThrow();
  });
});
