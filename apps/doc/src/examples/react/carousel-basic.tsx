import { Carousel, CarouselItem } from '@udixio/ui-react';

export default function CarouselBasicReact() {
  return (
    <Carousel variant="hero" gap={8}>
      <CarouselItem>
        <div className="p-6 bg-surface rounded-xl">Slide 1</div>
      </CarouselItem>
      <CarouselItem>
        <div className="p-6 bg-surface rounded-xl">Slide 2</div>
      </CarouselItem>
      <CarouselItem>
        <div className="p-6 bg-surface rounded-xl">Slide 3</div>
      </CarouselItem>
    </Carousel>
  );
}
