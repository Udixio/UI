import { Carousel, CarouselItem } from '@udixio/ui-react';

const slides = [
  { id: 'lake', label: 'Lake', tone: 'bg-primary-container' },
  { id: 'dunes', label: 'Dunes', tone: 'bg-tertiary-container' },
  { id: 'forest', label: 'Forest', tone: 'bg-secondary-container' },
  { id: 'coast', label: 'Coast', tone: 'bg-primary' },
  { id: 'ridge', label: 'Ridge', tone: 'bg-tertiary' },
];

/**
 * Hydrated (`client:visible`): the hero layout — one large slide, the others
 * shrinking towards the edge — is computed by the carousel's DOM controller,
 * so without JS every item would fall back to the same width.
 */
export function CarouselScene() {
  return (
    <Carousel variant="hero" gap={8} className="h-full">
      {slides.map(({ id, label, tone }) => (
        <CarouselItem key={id}>
          <div className={`flex h-full flex-col justify-end rounded-2xl p-3 ${tone}`}>
            <span className="text-label-large text-nowrap">{label}</span>
          </div>
        </CarouselItem>
      ))}
    </Carousel>
  );
}
