<script lang="ts">
  import { iClose } from '@udixio/icons-rounded-400/close';
  import { mergeClassNames, snackbarStyle, type SnackbarInterface } from '@udixio/core';
  import { createSnackbarAutoDismissController, createSnackbarTransitionController, type SnackbarTransitionController } from '@udixio/core/dom';
  import { untrack } from 'svelte';
  import IconButton from '../icon-button/IconButton.svelte';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteSnackbarProps } from './snackbar.types';

  let {
    message,
    open = $bindable(),
    defaultOpen = true,
    onOpenChange,
    duration,
    closeIcon = iClose,
    transition,
    class: hostClass = '',
    style: hostStyle,
    classes,
    ...rest
  }: SvelteSnackbarProps = $props();

  let panel: HTMLDivElement | undefined = $state();
  let transitionController: SnackbarTransitionController | undefined;
  const openState = createControllableState({
    value: () => open,
    defaultValue: () => defaultOpen,
    onChange: (next) => onOpenChange?.(next),
    assign: (next) => (open = next),
    componentName: 'Snackbar',
    stateName: 'open',
  });
  const isOpen = $derived(openState.current);
  const styles = createStyle(snackbarStyle, () => ({
    message,
    open,
    defaultOpen,
    duration,
    closeIcon,
    transition,
    isOpen,
    className: mergeClassNames<SnackbarInterface>('snackbar', classes, hostClass),
  }));

  $effect(() => {
    if (!panel) return;
    const created = createSnackbarTransitionController({ panel, open: untrack(() => isOpen), transition: untrack(() => transition) });
    transitionController = created;
    return () => {
      created.destroy();
      if (transitionController === created) transitionController = undefined;
    };
  });
  $effect(() => { transitionController?.setOpen(isOpen); });
  $effect(() => {
    if (!isOpen || !duration) return;
    const controller = createSnackbarAutoDismissController({ duration, onDismiss: () => openState.set(false) });
    return () => controller.destroy();
  });
  $effect(() => () => transitionController?.destroy());
</script>

<div
  {...rest}
  bind:this={panel}
  class={styles.current['snackbar']}
  style={hostStyle}
  role="status"
  aria-live="polite"
  aria-hidden={!isOpen}
  inert={!isOpen}
>
  <div class={styles.current['container']}>
    <p class={styles.current['supportingText']}>{message}</p>
    <IconButton label="Close the snackbar" icon={closeIcon} class={styles.current['icon']} onclick={() => openState.set(false)} />
  </div>
</div>
