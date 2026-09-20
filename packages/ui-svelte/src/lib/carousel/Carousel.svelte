<script lang="ts">
  import {
    carouselStyle,
    customScrollStyle,
    mergeClassNames,
    type CarouselInterface,
    type CarouselMetrics,
  } from '@udixio/core';
  import { createCarouselController, createCustomScrollController, type CarouselController, type CustomScrollController } from '@udixio/core/dom';
  import { untrack } from 'svelte';
  import { setCarouselContext } from './carousel-context.svelte';
  import type { CarouselItemRegistration } from './carousel-item-registration.svelte';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteCarouselProps } from './carousel.types';

  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

  let {
    children,
    variant = 'hero',
    gap = 8,
    scrollSensitivity = 1.25,
    outputRange = [42, 300],
    index = $bindable(),
    defaultIndex = 0,
    onIndexChange,
    onMetricsChange,
    accessibleLabel,
    class: hostClass = '',
    style: hostStyle,
    classes,
    onkeydown,
    ...rest
  }: SvelteCarouselProps = $props();

  let items = $state<CarouselItemRegistration[]>([]);
  let root: HTMLDivElement | undefined = $state();
  let scrollContainer: HTMLDivElement | undefined = $state();
  let scrollContent: HTMLDivElement | undefined = $state();
  let track: HTMLDivElement | undefined = $state();
  let viewportWidth = $state(0);
  let scrollVisible = $state(0);
  let isDragging = $state(false);
  let focusedIndex = $state(0);
  let carouselController: CarouselController | undefined;
  let customScrollController: CustomScrollController | undefined;
  let lastReportedIndex: number | undefined;
  let lastMetrics: CarouselMetrics | undefined;

  const indexState = createControllableState({
    value: () => index,
    defaultValue: () => defaultIndex,
    onChange: (next) => onIndexChange?.(next),
    assign: (next) => (index = next),
    componentName: 'Carousel',
    stateName: 'index',
  });
  const selectedIndex = $derived(indexState.current);
  const scrollSize = $derived(((Math.min(outputRange[1], viewportWidth || outputRange[1]) + gap) * items.length) / scrollSensitivity || 400);
  const spacerWidth = $derived(Math.max(0, scrollSize - viewportWidth));
  const styles = createStyle(carouselStyle, () => ({
    variant,
    gap,
    scrollSensitivity,
    outputRange,
    index,
    defaultIndex,
    onIndexChange,
    onMetricsChange,
    selectedIndex,
    className: mergeClassNames<CarouselInterface>('carousel', classes, hostClass),
  }));
  const scrollStyles = createStyle(customScrollStyle, () => ({
    orientation: 'horizontal' as const,
    draggable: true,
    isDragging,
    scrollSize,
    onScroll: undefined,
    scroll: undefined,
    setScroll: undefined,
    throttleDuration: 75,
    className: undefined,
  }));

  setCarouselContext({
    outputRange: () => outputRange,
    selectedIndex: () => indexState.current,
    indexOf: (item) => {
      const value = items.indexOf(item);
      return value === -1 ? undefined : value;
    },
    registerItem: (item) => {
      items = [...untrack(() => items), item];
      return () => { items = untrack(() => items).filter((candidate) => candidate !== item); };
    },
  });

  const emitMetrics = () => {
    if (!root || items.length === 0) return;
    const total = items.length;
    const viewport = root.clientWidth || 0;
    const visibleApprox = (viewport + gap) / (outputRange[1] + gap);
    const visibleFull = Math.max(1, Math.floor(visibleApprox));
    const stepHalf = Math.max(1, Math.round(visibleFull * (2 / 3)));
    const safeIndex = Math.min(Math.max(0, selectedIndex), Math.max(0, total - 1));
    const metrics: CarouselMetrics = {
      total,
      selectedIndex: safeIndex,
      visibleApprox,
      visibleFull,
      stepHalf,
      canPrev: safeIndex > 0,
      canNext: safeIndex < total - 1,
      scrollProgress: carouselController?.getProgress() ?? 0,
      viewportWidth: viewport,
      itemMaxWidth: outputRange[1],
      gap,
    };
    const changed = !lastMetrics || (Object.keys(metrics) as (keyof CarouselMetrics)[]).some((key) => metrics[key] !== lastMetrics?.[key]);
    if (changed) {
      lastMetrics = metrics;
      onMetricsChange?.(metrics);
    }
  };

  const centerOnIndex = (next: number) => {
    const safe = Math.min(Math.max(0, next), Math.max(0, items.length - 1));
    focusedIndex = safe;
    customScrollController?.scrollTo({ progress: clamp01(safe / Math.max(1, items.length - 1)), orientation: 'horizontal' });
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (!items.length) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); centerOnIndex(focusedIndex - 1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); centerOnIndex(focusedIndex + 1); }
    else if (event.key === 'Home') { event.preventDefault(); centerOnIndex(0); }
    else if (event.key === 'End') { event.preventDefault(); centerOnIndex(items.length - 1); }
    onkeydown?.(event);
  };

  $effect(() => {
    if (!root || !scrollContainer || !scrollContent || !track) return;
    const host = root;
    const container = scrollContainer;
    const content = scrollContent;
    const carouselTrack = track;
    // Controller creation must be independent of child registration. The
    // controller accessors intentionally read the latest signals later; if
    // setup tracked `items` through the initial synchronous layout pass, every
    // item mount would destroy and recreate the controllers.
    return untrack(() => {
      const custom = createCustomScrollController({
        container,
        content,
        orientation: () => 'horizontal',
        scrollSize: () => scrollSize,
        draggable: () => true,
        onScroll: (metrics) => {
          scrollVisible = metrics.scrollVisible;
          carouselController?.setProgress(metrics.scrollProgress);
        },
        onDraggingChange: (value) => { isDragging = value; },
        onDimensionsChange: (dimensions) => { viewportWidth = dimensions.width; },
      });
      const carousel = createCarouselController({
        track: carouselTrack,
        items: () => items.map((item) => item.element ?? null),
        viewport: () => scrollVisible || host.clientWidth || 0,
        gap: () => gap,
        minItemWidth: () => outputRange[0],
        maxItemWidth: () => outputRange[1],
        onSelectedIndexChange: (next) => { lastReportedIndex = next; indexState.set(next); focusedIndex = next; emitMetrics(); },
      });
      customScrollController = custom;
      carouselController = carousel;
      custom.notifyInitial();
      carousel.setProgress(items.length > 1 ? clamp01(selectedIndex / Math.max(1, items.length - 1)) : 0, { animate: false });
      return () => {
        custom.destroy();
        carousel.destroy();
        if (customScrollController === custom) customScrollController = undefined;
        if (carouselController === carousel) carouselController = undefined;
      };
    });
  });

  $effect(() => {
    items;
    gap;
    outputRange;
    carouselController?.update();
    emitMetrics();
  });

  $effect(() => {
    const external = index;
    if (external !== undefined && external !== lastReportedIndex && items.length) centerOnIndex(external);
  });
</script>

<div
  {...rest}
  bind:this={root}
  class={styles.current['carousel']}
  style={hostStyle}
  role="region"
  aria-label={accessibleLabel}
  aria-roledescription="carousel"
  onkeydown={handleKeydown}
>
  <div bind:this={scrollContainer} class={scrollStyles.current['customScroll']}>
    <div bind:this={scrollContent} class={scrollStyles.current['track']} style={`width: ${viewportWidth}px`}>
      <div bind:this={track} class={styles.current['track']} style={`gap: ${gap}px; will-change: transform`}>
        {@render children?.()}
      </div>
    </div>
    {#if spacerWidth > 0}<div class="flex-none" style={`width: ${spacerWidth}px`}></div>{/if}
  </div>
</div>
