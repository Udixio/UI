<script lang="ts">
  import AnchorPositioner from '../anchor-positioner/AnchorPositioner.svelte';
  import Button from '../button/Button.svelte';
  import type { SvelteTooltipSurfaceProps } from './tooltip-surface.types';

  let {
    anchor,
    surfaceId,
    position,
    title,
    text,
    buttons,
    content,
    isOpen,
    styles,
    onSurfaceHovered,
  }: SvelteTooltipSurfaceProps = $props();

  let surface: HTMLDivElement | undefined = $state();

  // `inert` is written as an attribute: Svelte would set the DOM property,
  // which jsdom does not implement and which `[inert]` selectors cannot see.
  $effect(() => {
    surface?.toggleAttribute('inert', !isOpen);
  });
  const buttonList = $derived(!buttons ? [] : Array.isArray(buttons) ? buttons : [buttons]);

  /** The panel element, once rendered; the attachment animates it. */
  export function getSurfaceElement(): HTMLDivElement | undefined {
    return surface;
  }
</script>

<!-- The positioner's box is only a carrier: it must never catch a pointer, or
     its transparent area covers whatever sits under the anchor. The surface
     opts back in with pointer-events-auto. -->
<AnchorPositioner {anchor} {position} class="pointer-events-none">
  <div
    bind:this={surface}
    id={surfaceId}
    role="tooltip"
    aria-hidden={!isOpen}
    class={styles['toolTip']}
    style:opacity={0}
    onmouseenter={() => onSurfaceHovered?.(true)}
    onmouseleave={() => onSurfaceHovered?.(false)}
  >
    <div class={styles['container']}>
      {#if content}
        <div class={styles['content']}>{@render content()}</div>
      {:else}
        {#if title}<div class={styles['subHead']}>{title}</div>{/if}
        {#if text}<div class={styles['supportingText']}>{text}</div>{/if}
        {#if buttonList.length}
          <div class={styles['actions']}>
            {#each buttonList as button (button.label)}
              <Button size="small" variant="text" edgeAligned label={button.label} onclick={() => button.onclick?.()} />
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</AnchorPositioner>
