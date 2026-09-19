<script lang="ts">
  import { untrack } from 'svelte';
  import { mergeClassNames, stateLayerStyle, type StateLayerInterface } from '@udixio/core';
  import {
    createStateLayerController,
    findStateLayerTrigger,
    type StateLayerController,
  } from '@udixio/core/dom';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteStateLayerProps } from './state-layer.types';

  let {
    colorName,
    stateClassName = 'state-ripple-group',
    shapeTransition,
    transitionDuration,
    class: hostClass = '',
    classes,
  }: SvelteStateLayerProps = $props();

  let layer: HTMLSpanElement | undefined = $state();
  let controller: StateLayerController | undefined;
  // Read through a derived so the connect effect keys off the value, not the
  // props object: a parent that spreads props would otherwise re-create the
  // controller on every unrelated update.
  const triggerClassName = $derived(stateClassName);

  const styles = createStyle(stateLayerStyle, () => ({
    colorName,
    stateClassName,
    shapeTransition,
    transitionDuration,
    className: mergeClassNames<StateLayerInterface>('stateLayer', classes, hostClass),
  }));

  $effect(() => {
    if (!layer) return;
    const trigger = findStateLayerTrigger(layer, triggerClassName);
    if (!trigger) return;

    const created = createStateLayerController({
      trigger,
      layer,
      disabled: () => trigger.matches(':disabled, [aria-disabled="true"]'),
    });
    controller = created;
    created.updateShape(untrack(() => shapeTransition));

    return () => {
      created.destroy();
      if (controller === created) {
        controller = undefined;
      }
    };
  });

  $effect(() => {
    controller?.updateShape(shapeTransition);
  });
</script>

<span
  bind:this={layer}
  aria-hidden="true"
  class={styles.current['stateLayer']}
  style:--state-color={`var(--color-${colorName}, var(--color-on-surface))`}
  style:transition={transitionDuration === undefined ? undefined : `${transitionDuration}s`}
></span>
