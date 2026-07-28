import { Carousel, CarouselItem } from '@udixio/ui-react';

const slides = Array.from({ length: 15 }, (_, i) => i + 1).map((id) => {
  const fmt = id % 3;
  return {
    id,
    fmt,
    width: fmt === 0 ? 640 : fmt === 1 ? 400 : 240,
    height: fmt === 0 ? 240 : fmt === 1 ? 400 : 640,
  };
});

export default function CarouselGalleryReact() {
  return (
    <Carousel
      variant="hero"
      gap={16}
      scrollSensitivity={0.8}
      onIndexChange={(index) => console.log('Active slide:', index)}
    >
      {slides.map(({ id, fmt, width, height }) => (
        <CarouselItem key={id}>
          <div className="bg-surface rounded-xl h-full flex flex-col">
            <div className="flex-1 min-h-0">
              <img
                className="size-full object-cover rounded-2xl"
                src={`https://picsum.photos/seed/udx-${id}-fmt-${fmt}/${width}/${height}`}
                alt="Cover"
              />
            </div>
            <p className="text-title-large m-8 text-nowrap">Slide {id}</p>
          </div>
        </CarouselItem>
      ))}
    </Carousel>
  );
}
