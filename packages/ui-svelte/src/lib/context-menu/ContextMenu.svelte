<script lang="ts">
  import {
    createContextMenuController,
    createMenuTransitionController,
    measureMenuBox,
    type MenuTransitionController,
    resolveContextMenuPosition,
    resolveBoxElement,
    showContextMenuPopover,
  } from '@udixio/core/dom';
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
  // The place of the popup while it is rendered: open, or playing its exit.
  let position = $state<{ x: number; y: number } | null>(null);
  let open = $state(false);
  // The pointer the menu opened at, which its scale grows from (the popup may be moved to stay in the viewport).
  let point = { x: 0, y: 0 };
  let controller: ReturnType<typeof createContextMenuController> | undefined;
  let transition: MenuTransitionController | undefined;

  // Menu children rendered in the popup should inherit the same context as a regular Menu.
  setMenuContext({ purpose: () => 'actions', variant: () => variant, registerGroup: () => () => undefined });

  // The popup stays rendered, inert, while its exit plays; it is removed once the exit has ended.
  const close = () => {
    if (!open) return;
    open = false;
    onOpenChange?.(false);
  };
  const openAt = (x: number, y: number) => {
    if (disabled) return;
    const wasOpen = open;
    point = { x, y };
    open = true;
    position = { x, y };
    if (!wasOpen) onOpenChange?.(true);
  };
  const handleContextMenu = (event: MouseEvent) => {
    if (disabled) return;
    event.preventDefault();
    openAt(event.clientX, event.clientY);
  };

  // One motion per popup: it grows from the pointer as it opens and shrinks back as it closes.
  $effect(() => {
    const menuElement = menu?.querySelector<HTMLElement>('[role="menu"]');
    if (!menuElement) return;
    const created = createMenuTransitionController({
      menu: menuElement,
      anchor: () => ({ left: point.x, top: point.y, right: point.x, bottom: point.y }),
      onExited: () => {
        if (!open) position = null;
      },
    });
    transition = created;
    return () => {
      created.destroy();
      if (transition === created) transition = undefined;
    };
  });

  $effect(() => {
    const isOpenNow = open;
    if (!position || !root || !triggerHost || !menu) return;
    const triggerElement = triggerHost.querySelector<HTMLElement>('button, a[href], input, select, textarea, [tabindex]') ?? triggerHost;
    showContextMenuPopover(menu);
    const menuElement = menu.querySelector<HTMLElement>('[role="menu"]');
    if (!menuElement) return;
    const ownerWindow = root.ownerDocument.defaultView;
    if (!ownerWindow) return;
    // Measured without the scale of a running motion, so a menu opened again while it leaves keeps its size.
    const menuRect = measureMenuBox(menuElement);
    const documentElement = root.ownerDocument.documentElement;
    const nextPosition = resolveContextMenuPosition(
      position,
      { width: menuRect.width, height: menuRect.height },
      {
        width: documentElement.clientWidth || ownerWindow.innerWidth,
        height: documentElement.clientHeight || ownerWindow.innerHeight,
      },
    );
    if (nextPosition.x !== position.x || nextPosition.y !== position.y) {
      position = nextPosition;
      return;
    }
    // Placed, before it is painted: the motion measures it for its origin.
    transition?.setOpen(isOpenNow);
    if (!isOpenNow) return;
    const created = createContextMenuController({ root, trigger: triggerElement, menu: menuElement, onDismiss: close });
    controller = created;
    return () => {
      created.destroy();
      if (controller === created) controller = undefined;
    };
  });

  $effect(() => () => controller?.destroy());
</script>

<!-- The menu is in the top layer and the trigger is the author's: the root has no box to give (`none`), so a motion
     attached to the ContextMenu binds nothing rather than moving the trigger. The menu animates its own open and close. -->
<div {...rest} bind:this={root} class={hostClass} style="display: contents" data-motion-box="none">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <span
    bind:this={triggerHost}
    style="display: contents"
    oncontextmenu={handleContextMenu}
    onkeydown={(event) => {
      if (event.shiftKey && event.key === 'F10') {
        event.preventDefault();
        const rect = triggerHost
          ? resolveBoxElement(triggerHost).getBoundingClientRect()
          : undefined;
        openAt(rect?.left ?? 0, rect?.bottom ?? 0);
      }
    }}
  >
    {@render trigger?.()}
  </span>
  {#if position}
    <div bind:this={menu} class="fixed z-50 rounded-lg" role="presentation" inert={!open} popover="manual" style={`inset: auto; margin: 0; top: ${position.y}px; left: ${position.x}px; right: auto; bottom: auto; max-width: calc(100vw - 16px); max-height: calc(100vh - 16px); overflow: visible`}>
      <Menu purpose="actions" {variant} {accessibleLabel}>{@render children?.()}</Menu>
    </div>
  {/if}
</div>
