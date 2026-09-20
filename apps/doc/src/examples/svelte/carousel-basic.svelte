<script lang="ts">
  import { Carousel, CarouselItem } from '@udixio/ui-svelte';
</script>

<Carousel variant="hero" gap={8} accessibleLabel="Featured slides">
  <CarouselItem><div class="rounded-xl bg-surface p-6">Slide 1</div></CarouselItem>
  <CarouselItem><div class="rounded-xl bg-surface p-6">Slide 2</div></CarouselItem>
  <CarouselItem><div class="rounded-xl bg-surface p-6">Slide 3</div></CarouselItem>
</Carousel>
