<script lang="ts">
  import { carouselItemStyle, mergeClassNames, type CarouselItemInterface } from '@udixio/core';
  import { createStyle } from '../utils/create-style.svelte';
  import { getCarouselContext, type CarouselItemRegistration } from './carousel-context.svelte';
  import type { SvelteCarouselItemProps } from './carousel-item.types';

  let { children, outputRange, class: hostClass = '', classes, ...rest }: SvelteCarouselItemProps = $props();
  const context = getCarouselContext();
  const resolvedOutputRange = $derived(outputRange ?? context?.outputRange());
  const registration = $state<CarouselItemRegistration>({});
  const index = $derived(context?.indexOf(registration));
  const selectedIndex = $derived(context?.selectedIndex() ?? -1);
  const styles = createStyle(carouselItemStyle, () => ({
    outputRange: resolvedOutputRange,
    className: mergeClassNames<CarouselItemInterface>('carouselItem', classes, hostClass),
  }));
  let element: HTMLDivElement | undefined = $state();

  $effect(() => {
    registration.element = element;
    if (!context) return;
    const unregister = context.registerItem(registration);
    return unregister;
  });
  $effect(() => {
    if (!context || !element) return;
    element.tabIndex = index === selectedIndex ? 0 : -1;
    element.setAttribute('role', 'group');
    element.setAttribute('aria-roledescription', 'slide');
    const total = element.parentElement?.querySelectorAll('[data-carousel-item]').length ?? 0;
    element.setAttribute('aria-label', `${(index ?? 0) + 1} / ${total}`);
  });
</script>

<div
  {...rest}
  bind:this={element}
  data-carousel-item
  class={styles.current['carouselItem']}
  style={`width: var(--carousel-item-width, 100%); max-width: ${resolvedOutputRange?.[1] ?? ''}${resolvedOutputRange ? 'px' : ''}; min-width: ${resolvedOutputRange?.[0] ?? ''}${resolvedOutputRange ? 'px' : ''}`}
  onfocus={() => undefined}
>
  {@render children?.()}
</div>
