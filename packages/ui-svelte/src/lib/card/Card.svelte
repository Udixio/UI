<script lang="ts">
  import {
    cardStyle,
    getCardKeyActivation,
    mergeClassNames,
    type CardInterface,
    type CardKeyPhase,
  } from '@udixio/core';
  import { createStyle } from '../utils/create-style.svelte';
  import StateLayer from '../state-layer/StateLayer.svelte';
  import type { SvelteCardProps } from './card.types';

  let {
    variant = 'outlined',
    interactive = false,
    class: hostClass = '',
    classes,
    children,
    href,
    target,
    rel,
    role,
    tabindex,
    onkeydown,
    onkeyup,
    ...rest
  }: SvelteCardProps = $props();

  const isActionable = $derived(interactive || href !== undefined);
  const styles = createStyle(cardStyle, () => ({
    variant,
    interactive: isActionable,
    className: mergeClassNames<CardInterface>('card', classes, hostClass),
  }));

  type KeyHandler = SvelteCardProps['onkeydown'];

  const handleKey = (
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLElement },
    phase: CardKeyPhase,
    consumerHandler: KeyHandler,
  ) => {
    consumerHandler?.(event);
    if (event.defaultPrevented) return;

    const decision = getCardKeyActivation({ key: event.key, phase });
    if (decision.preventScroll) event.preventDefault();
    if (decision.activate) event.currentTarget.click();
  };
</script>

{#snippet content()}
  {#if isActionable}
    <StateLayer
      class={styles.current['stateLayer']}
      colorName="on-surface"
      stateClassName="state-ripple-group-[card]"
    />
  {/if}
  {@render children?.()}
{/snippet}

{#if href !== undefined}
  <a {...rest} {href} {target} {rel} {role} {tabindex} {onkeydown} {onkeyup} class={styles.current['card']}>
    {@render content()}
  </a>
{:else if interactive}
  <!-- The role resolves to `button` unless the consumer overrides it, which the compiler cannot see. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    {...rest}
    role={role ?? 'button'}
    tabindex={tabindex ?? 0}
    onkeydown={(event) => handleKey(event, 'down', onkeydown)}
    onkeyup={(event) => handleKey(event, 'up', onkeyup)}
    class={styles.current['card']}
  >
    {@render content()}
  </div>
{:else}
  <!-- A static card forwards `role`/`tabindex` untouched; their consistency is the consumer's, as in React. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div {...rest} {role} {tabindex} {onkeydown} {onkeyup} class={styles.current['card']}>
    {@render content()}
  </div>
{/if}
