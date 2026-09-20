<script lang="ts">
  import { createContextMenuController } from '@udixio/core/dom';
  import Menu from '../menu/Menu.svelte';
  import { setMenuContext } from '../menu/menu-context.svelte';
  import type { SvelteContextMenuProps } from './context-menu.types';

  let {
    trigger,
    children,
    variant = 'standard',
    accessibleLabel,
    disabled = false,
    onOpenChange,
    class: hostClass = '',
    ...rest
  }: SvelteContextMenuProps = $props();

  let root: HTMLDivElement | undefined = $state();
  let triggerHost: HTMLSpanElement | undefined = $state();
  let menu: HTMLDivElement | undefined = $state();
  let position = $state<{ x: number; y: number } | null>(null);
  let controller: ReturnType<typeof createContextMenuController> | undefined;

  // Menu children rendered in the popup should inherit the same context as a regular Menu.
  setMenuContext({ purpose: () => 'actions', variant: () => variant, registerGroup: () => () => undefined });

  const close = () => {
    if (!position) return;
    position = null;
    onOpenChange?.(false);
  };
  const openAt = (x: number, y: number) => {
    if (disabled) return;
    const wasOpen = !!position;
    position = { x, y };
    if (!wasOpen) onOpenChange?.(true);
  };
  const handleContextMenu = (event: MouseEvent) => {
    if (disabled) return;
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    openAt(event.clientX || rect.left, event.clientY || rect.bottom);
  };

  $effect(() => {
    if (!position || !root || !triggerHost || !menu) return;
    const triggerElement = triggerHost.querySelector<HTMLElement>('button, a[href], input, select, textarea, [tabindex]') ?? triggerHost;
    const menuElement = menu.querySelector<HTMLElement>('[role="menu"]');
    if (!menuElement) return;
    const created = createContextMenuController({ root, trigger: triggerElement, menu: menuElement, onDismiss: close });
    controller = created;
    return () => {
      created.destroy();
      if (controller === created) controller = undefined;
    };
  });

  $effect(() => () => controller?.destroy());
</script>

<div {...rest} bind:this={root} class={hostClass} style="display: contents">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <span
    bind:this={triggerHost}
    style="display: contents"
    oncontextmenu={handleContextMenu}
    onkeydown={(event) => {
      if (event.shiftKey && event.key === 'F10') {
        event.preventDefault();
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        openAt(rect.left, rect.bottom);
      }
    }}
  >
    {@render trigger?.()}
  </span>
  {#if position}
    <div bind:this={menu} class="fixed z-50" role="presentation" style={`top: ${position.y}px; left: ${position.x}px`} onclick={close}>
      <Menu purpose="actions" {variant} {accessibleLabel}>{@render children?.()}</Menu>
    </div>
  {/if}
</div>
