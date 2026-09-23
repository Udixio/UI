<script lang="ts">
  import { untrack } from 'svelte';
  import {
    createAnchorPositionerController,
    type AnchorPositionerController,
  } from '@udixio/core/dom';
  import type { SvelteAnchorPositionerProps } from './anchor-positioner.types';

  let { anchor, position = 'bottom', autoAxis = 'vertical', children, ...rest }: SvelteAnchorPositionerProps = $props();

  let floating: HTMLDivElement | undefined = $state();
  let controller: AnchorPositionerController | undefined;
  const anchorElement = $derived(anchor);

  // Portal: the box is moved to `document.body` once mounted, and removed with
  // the component since Svelte only unmounts what it still owns in place.
  $effect(() => {
    if (!floating) return;
    const element = floating;
    document.body.appendChild(element);
    return () => element.remove();
  });

  $effect(() => {
    if (!floating || !anchorElement) return;
    const created = createAnchorPositionerController({
      anchor: anchorElement,
      floating,
      position: () => untrack(() => position),
      autoAxis: () => untrack(() => autoAxis),
    });
    controller = created;
    return () => {
      created.destroy();
      if (controller === created) controller = undefined;
    };
  });

  $effect(() => {
    void position;
    void autoAxis;
    controller?.update();
  });
</script>

<div bind:this={floating} {...rest} style:z-index={50}>
  {@render children?.()}
</div>
