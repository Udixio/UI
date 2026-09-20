<script lang="ts">
  import type { CarouselMetrics } from '@udixio/core';
  import { Button, Carousel, CarouselItem } from '@udixio/ui-svelte';

  const total = 15;
  const slides = Array.from({ length: total }, (_, index) => index + 1).map((id) => {
    const fmt = id % 3;
    return { id, fmt, width: fmt === 0 ? 640 : fmt === 1 ? 400 : 240, height: fmt === 0 ? 240 : fmt === 1 ? 400 : 640 };
  });
  let index = $state(0);
  let step = $state(1);
  let visible = $state({ approx: 0, full: 0 });

  const handleMetricsChange = (metrics: CarouselMetrics) => {
    step = metrics.stepHalf;
    visible = { approx: metrics.visibleApprox, full: metrics.visibleFull };
  };
</script>

<div class="w-full">
  <Carousel bind:index variant="hero" scrollSensitivity={0.8} onMetricsChange={handleMetricsChange} accessibleLabel="Gallery with navigation">
    {#each slides as slide (slide.id)}
      <CarouselItem>
        <div class="flex h-full flex-col rounded-xl bg-surface">
          <div class="min-h-0 flex-1"><img class="size-full rounded-2xl object-cover" src={`https://picsum.photos/seed/udx-${slide.id}-fmt-${slide.fmt}/${slide.width}/${slide.height}`} alt="Cover" /></div>
          <p class="m-8 text-title-large text-nowrap">Slide {slide.id}</p>
        </div>
      </CarouselItem>
    {/each}
  </Carousel>
  <div class="mt-3 flex w-full items-center justify-between gap-3">
    <div class="text-body-small text-on-surface-variant">Visible ≈ {visible.approx.toFixed(2)} (full {visible.full}), step: {step}</div>
    <div class="flex gap-3">
      <Button variant="text" label="Previous" onclick={() => (index = Math.max(0, index - step))} />
      <Button variant="filled" label="Next" onclick={() => (index = Math.min(total - 1, index + step))} />
    </div>
  </div>
</div>
