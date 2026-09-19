<script lang="ts">
  import { untrack } from 'svelte';
  import {
    clampProgressValue,
    isDeterminateVariant,
    mergeClassNames,
    progressIndicatorStyle,
    type ProgressIndicatorInterface,
  } from '@udixio/core';
  import {
    createCircularProgressController,
    createLinearIndeterminateController,
    createProgressVisibilityController,
  } from '@udixio/core/dom';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteProgressIndicatorProps } from './progress-indicator.types';

  let {
    variant = 'linear-determinate',
    value = 0,
    transitionDuration = 1000,
    minHeight,
    class: hostClass = '',
    classes,
    ...rest
  }: SvelteProgressIndicatorProps = $props();

  const completedPercentage = $derived(clampProgressValue(value));
  // Seeded once; the visibility controller owns every later change.
  let isVisible = $state(untrack(() => clampProgressValue(value) < 100));

  let indeterminateSvg: SVGSVGElement | undefined = $state();
  let indeterminateCircle: SVGCircleElement | undefined = $state();
  let leadingBar: HTMLDivElement | undefined = $state();
  let gapTrack: HTMLDivElement | undefined = $state();
  let trailingBar: HTMLDivElement | undefined = $state();

  const ariaValueNow = $derived(isDeterminateVariant(variant) ? completedPercentage : undefined);
  const circularRadius = $derived(isVisible ? 22 : 24);
  const circumference = $derived(2 * Math.PI * circularRadius);
  const strokeDashoffset = $derived(circumference * (1 - completedPercentage / 100));
  const activeIndicatorTransition = $derived(
    `width ${transitionDuration}ms ease-in-out${
      completedPercentage === 100 ? ', max-height 200ms 0.5s ease-in-out' : ''
    }`,
  );
  const lastTrackMarginLeft = $derived(completedPercentage !== 100 ? '6px' : '0px');
  const lastTrackTransition = $derived(
    `width ${transitionDuration}ms ease-in-out${
      completedPercentage === 100
        ? `, max-height 200ms 0.5s ease-in-out, margin-left ${transitionDuration}ms ${transitionDuration / 1.5}ms`
        : ''
    }`,
  );
  const stopTransition = $derived(
    `width ${transitionDuration}ms ease-in-out, max-height 200ms 0.5s ease-in-out`,
  );

  const styles = createStyle(progressIndicatorStyle, () => ({
    className: mergeClassNames<ProgressIndicatorInterface>('progressIndicator', classes, hostClass),
    variant,
    value,
    transitionDuration,
    minHeight,
    isVisible,
  }));

  $effect(() =>
    createProgressVisibilityController({
      completedPercentage,
      transitionDuration,
      onVisibilityChange: (visible) => (isVisible = visible),
    }),
  );

  $effect(() => {
    if (variant !== 'circular-indeterminate' || !indeterminateSvg || !indeterminateCircle) return;
    return createCircularProgressController({ svg: indeterminateSvg, circle: indeterminateCircle });
  });

  $effect(() => {
    if (variant !== 'linear-indeterminate' || !leadingBar || !gapTrack || !trailingBar) return;
    return createLinearIndeterminateController({ leadingBar, gapTrack, trailingBar });
  });
</script>

{#if variant === 'linear-indeterminate'}
  <div
    {...rest}
    class={styles.current['progressIndicator']}
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <div bind:this={leadingBar} style:flex-shrink={0} class={styles.current['activeIndicator']}></div>
    <div bind:this={gapTrack} style:flex-shrink={0} class={styles.current['firstTrack']}></div>
    <div
      bind:this={trailingBar}
      style:flex-shrink={0}
      style:margin-left="6px"
      class={styles.current['activeIndicator']}
    ></div>
    <div style:margin-left="6px" class={styles.current['lastTrack']}></div>
  </div>
{:else if variant === 'linear-determinate'}
  <div
    {...rest}
    class={styles.current['progressIndicator']}
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={ariaValueNow}
  >
    <div
      style:width={`${completedPercentage}%`}
      style:transition={activeIndicatorTransition}
      class={styles.current['activeIndicator']}
    ></div>
    <div
      style:margin-left={lastTrackMarginLeft}
      style:transition={lastTrackTransition}
      class={styles.current['lastTrack']}
    ></div>
    <div style:width="4px" style:transition={stopTransition} class={styles.current['stop']}></div>
  </div>
{:else if variant === 'circular-indeterminate'}
  <svg
    {...rest}
    bind:this={indeterminateSvg}
    width="48"
    height="48"
    viewBox="0 0 48 48"
    class={styles.current['progressIndicator']}
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <circle
      bind:this={indeterminateCircle}
      cx="50%"
      cy="50%"
      r="calc(50% - 2px)"
      style:stroke-linecap="round"
      class={styles.current['activeIndicator']}
    />
  </svg>
{:else}
  <svg
    {...rest}
    width="48"
    height="48"
    viewBox="0 0 48 48"
    style:transform="rotate(-90deg)"
    class={styles.current['progressIndicator']}
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={ariaValueNow}
  >
    <circle
      cx="50%"
      cy="50%"
      r={circularRadius}
      style:stroke-linecap="round"
      style:stroke-dasharray={circumference}
      style:stroke-dashoffset={strokeDashoffset}
      style:transition={`stroke-dashoffset ${transitionDuration}ms ease-in-out`}
      class={styles.current['activeIndicator']}
    />
  </svg>
{/if}
