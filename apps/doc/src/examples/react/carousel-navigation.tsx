import { useState } from 'react';
import {
  Button,
  Carousel,
  CarouselItem,
  type CarouselMetrics,
} from '@udixio/ui-react';

const total = 15;
const slides = Array.from({ length: total }, (_, i) => i + 1).map((id) => {
  const fmt = id % 3;
  return {
    id,
    fmt,
    width: fmt === 0 ? 640 : fmt === 1 ? 400 : 240,
    height: fmt === 0 ? 240 : fmt === 1 ? 400 : 640,
  };
});

export default function CarouselNavigationReact() {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(1);
  const [visible, setVisible] = useState({ approx: 0, full: 0 });

  const prev = () => setIndex((i) => Math.max(0, i - step));
  const next = () => setIndex((i) => Math.min(total - 1, i + step));

  const handleMetricsChange = (metrics: CarouselMetrics) => {
    setStep(metrics.stepHalf); // step equals half of the visible items
    setVisible({ approx: metrics.visibleApprox, full: metrics.visibleFull });
  };

  return (
    <div className="w-full">
      <Carousel
        variant="hero"
        scrollSensitivity={0.8}
        index={index}
        onIndexChange={setIndex}
        onMetricsChange={handleMetricsChange}
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
      <div className="w-full mt-3 flex items-center justify-between gap-3">
        <div className="text-on-surface-variant text-body-small">
          Visible ≈ {visible.approx.toFixed(2)} (full {visible.full}), step: {step}
        </div>
        <div className="flex gap-3">
          <Button variant="text" label="Previous" onClick={prev} />
          <Button variant="filled" label="Next" onClick={next} />
        </div>
      </div>
    </div>
  );
}
