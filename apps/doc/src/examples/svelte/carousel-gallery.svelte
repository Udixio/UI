<script lang="ts">
  import { Carousel, CarouselItem } from '@udixio/ui-svelte';

  const slides = Array.from({ length: 15 }, (_, index) => index + 1).map((id) => {
    const fmt = id % 3;
    return { id, fmt, width: fmt === 0 ? 640 : fmt === 1 ? 400 : 240, height: fmt === 0 ? 240 : fmt === 1 ? 400 : 640 };
  });
</script>

<Carousel variant="hero" gap={16} scrollSensitivity={0.8} onIndexChange={(index) => console.log('Active slide:', index)} accessibleLabel="Gallery">
  {#each slides as slide (slide.id)}
    <CarouselItem>
      <div class="flex h-full flex-col rounded-xl bg-surface">
        <div class="min-h-0 flex-1"><img class="size-full rounded-2xl object-cover" src={`https://picsum.photos/seed/udx-${slide.id}-fmt-${slide.fmt}/${slide.width}/${slide.height}`} alt="Cover" /></div>
        <p class="m-8 text-title-large text-nowrap">Slide {slide.id}</p>
      </div>
    </CarouselItem>
  {/each}
</Carousel>
