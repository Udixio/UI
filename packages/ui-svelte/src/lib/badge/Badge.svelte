<script lang="ts">
  import { untrack } from 'svelte';
  import {
    badgeStyle,
    mergeClassNames,
    resolveBadgeLabel,
    resolveBadgeVariant,
    type BadgeInterface,
  } from '@udixio/core';
  import {
    createBadgeTransitionController,
    type BadgeTransitionController,
  } from '@udixio/core/dom';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteBadgeProps } from './badge.types';

  let {
    label,
    max,
    description,
    visible = true,
    transition,
    class: hostClass = '',
    classes,
    children,
    ...rest
  }: SvelteBadgeProps = $props();

  const resolvedLabel = $derived(resolveBadgeLabel({ label, max }));
  const variant = $derived(resolveBadgeVariant(resolvedLabel));
  const announced = $derived(visible && !!description);
  const styles = createStyle(badgeStyle, () => ({
    label,
    max,
    description,
    visible,
    transition,
    variant,
    attached: false,
    className: mergeClassNames<BadgeInterface>('container', classes, hostClass),
  }));

  let badge: HTMLSpanElement | undefined = $state();
  let controller: BadgeTransitionController | undefined;
  // The value the controller last received; the update effect also runs once
  // right after connection, and must not replay the instant first apply.
  let appliedVisible: boolean | undefined;
  // Captured once so first paint already matches `visible`; later changes go
  // through the controller, and a re-rendered style would cut its exit short.
  const initiallyHidden = untrack(() => !visible);
  // Read through deriveds so the connect effect keys off the values, not the
  // props object of a spreading parent.
  const transitionDuration = $derived(transition?.duration);
  const transitionEase = $derived(transition?.ease);

  $effect(() => {
    if (!badge) return;
    void transitionDuration;
    void transitionEase;
    const created = createBadgeTransitionController({
      element: badge,
      transition: untrack(() => transition),
    });
    controller = created;
    appliedVisible = untrack(() => visible);
    created.setVisible(appliedVisible, true);
    return () => {
      created.destroy();
      if (controller === created) controller = undefined;
    };
  });

  $effect(() => {
    if (!controller || visible === appliedVisible) return;
    appliedVisible = visible;
    controller.setVisible(visible);
  });
</script>

<span class={styles.current['container']} {...rest}>
  {@render children?.()}
  <span
    bind:this={badge}
    class={styles.current['badge']}
    style:visibility={initiallyHidden ? 'hidden' : undefined}
    style:opacity={initiallyHidden ? 0 : undefined}
    role={announced ? 'status' : undefined}
    aria-hidden={announced ? undefined : true}
  >
    {#if resolvedLabel !== undefined}
      <span class={styles.current['label']} aria-hidden="true">{resolvedLabel}</span>
    {/if}
    {#if description}
      <span class={styles.current['announcement']}>{description}</span>
    {/if}
  </span>
</span>
