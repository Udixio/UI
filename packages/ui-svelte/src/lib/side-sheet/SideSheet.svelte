<script module lang="ts">
  let nextSideSheetId = 0;
</script>

<script lang="ts">
  import { iClose } from '@udixio/icons-rounded-400/close';
  import { mergeClassNames, sideSheetStyle, type SideSheetInterface } from '@udixio/core';
  import { createSideSheetController, createSideSheetTransitionController, type SideSheetController, type SideSheetTransitionController } from '@udixio/core/dom';
  import { untrack } from 'svelte';
  import Divider from '../divider/Divider.svelte';
  import IconButton from '../icon-button/IconButton.svelte';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteSideSheetProps } from './side-sheet.types';

  let {
    children,
    variant = 'standard',
    title,
    position = 'right',
    open = $bindable(),
    defaultOpen = true,
    onOpenChange,
    closeIcon = iClose,
    divider,
    transition,
    container,
    class: hostClass = '',
    style: hostStyle,
    classes,
    ...rest
  }: SvelteSideSheetProps = $props();

  let portalRoot: HTMLDivElement | undefined = $state();
  let panel: HTMLDivElement | undefined = $state();
  let overlay: HTMLDivElement | undefined = $state();
  let transitionController: SideSheetTransitionController | undefined;
  let modalController: SideSheetController | undefined;
  let originalParent: Node | null = null;
  let originalNextSibling: Node | null = null;
  let portaledTo: Element | null = null;
  const titleId = `side-sheet-title-${nextSideSheetId++}`;
  const isModal = $derived(variant === 'modal');
  const showDivider = $derived(isModal ? false : (divider ?? true));
  const closeLabel = $derived(title ? `Close ${title}` : 'Close');
  const openState = createControllableState({
    value: () => open,
    defaultValue: () => defaultOpen,
    onChange: (next) => onOpenChange?.(next),
    assign: (next) => (open = next),
    componentName: 'SideSheet',
    stateName: 'open',
  });
  const isOpen = $derived(openState.current);
  const styles = createStyle(sideSheetStyle, () => ({
    variant,
    title,
    position,
    open,
    defaultOpen,
    closeIcon,
    divider,
    transition,
    isOpen,
    className: mergeClassNames<SideSheetInterface>('sideSheet', classes, hostClass),
  }));

  $effect(() => {
    if (!portalRoot) return;
    const target = container ?? document.body;
    if (isModal) {
      if (!originalParent) {
        originalParent = portalRoot.parentNode;
        originalNextSibling = portalRoot.nextSibling;
      }
      if (portalRoot.parentNode !== target) target.appendChild(portalRoot);
      portaledTo = target;
    } else if (portaledTo && originalParent) {
      originalParent.insertBefore(portalRoot, originalNextSibling);
      portaledTo = null;
    }
  });

  $effect(() => {
    if (!panel) return;
    const created = createSideSheetTransitionController({ container: panel.querySelector<HTMLElement>('[data-side-sheet-container]') ?? panel, overlay, transition: untrack(() => transition) });
    transitionController = created;
    created.setOpen(untrack(() => isOpen), true);
    return () => {
      created.destroy();
      if (transitionController === created) transitionController = undefined;
    };
  });
  $effect(() => {
    transitionController?.setOpen(isOpen);
  });
  $effect(() => {
    if (!isModal || !isOpen || !panel) {
      modalController?.destroy();
      modalController = undefined;
      return;
    }
    const created = createSideSheetController({ panel, overlay, container: container ?? document.body, onDismiss: () => openState.set(false) });
    modalController = created;
    return () => {
      created.destroy();
      if (modalController === created) modalController = undefined;
    };
  });
  $effect(() => () => {
    transitionController?.destroy();
    modalController?.destroy();
    if (portalRoot && portaledTo && originalParent) originalParent.insertBefore(portalRoot, originalNextSibling);
  });
</script>

<div bind:this={portalRoot} style="display: contents">
  {#if isModal}
    <div bind:this={overlay} class={styles.current['overlay']} aria-hidden="true" inert={!isOpen} onclick={() => openState.set(false)}></div>
  {/if}
  <div
    {...rest}
    bind:this={panel}
    class={styles.current['sideSheet']}
    style={hostStyle}
    role={isModal ? 'dialog' : undefined}
    aria-modal={isModal ? 'true' : undefined}
    aria-labelledby={title ? titleId : undefined}
    aria-hidden={!isOpen}
    inert={!isOpen}
  >
    <div data-side-sheet-container class={styles.current['container']}>
      <div class={styles.current['header']}>
        {#if title}<p id={titleId} class={styles.current['title']}>{title}</p>{/if}
        <IconButton size="small" label={closeLabel} icon={closeIcon} class={styles.current['closeButton']} onclick={() => openState.set(false)} />
      </div>
      <div class={styles.current['content']}>{@render children?.()}</div>
    </div>
    {#if showDivider}<Divider class={styles.current['divider']} orientation="vertical" />{/if}
  </div>
</div>
