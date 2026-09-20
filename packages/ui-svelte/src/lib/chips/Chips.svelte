<script lang="ts">
  import { chipsStyle, mergeClassNames, type ChipItem, type ChipsInterface } from '@udixio/core';
  import Divider from '../divider/Divider.svelte';
  import Chip from '../chip/Chip.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteChipsProps } from './chips.types';

  let {
    variant = 'input',
    label = 'Chips',
    items = $bindable<ChipItem[]>([]),
    onItemsChange,
    scrollable = true,
    draggable = false,
    class: hostClass = '',
    classes,
    ...rest
  }: SvelteChipsProps = $props();

  let root: HTMLDivElement | undefined = $state();
  let focused = $state(false);
  let editingId = $state<string | undefined>();
  let creating = $state(false);
  let nextId = 0;
  const ids = new WeakMap<object, string>();

  const list = $derived(items ?? []);
  const styles = createStyle(chipsStyle, () => ({
    variant,
    label,
    items: list,
    onItemsChange,
    scrollable,
    draggable,
    className: mergeClassNames<ChipsInterface>('chips', classes, hostClass),
  }));

  const itemId = (item: ChipItem) => {
    if (item.id) return item.id;
    let id = ids.get(item);
    if (!id) {
      id = `chip-${nextId++}`;
      ids.set(item, id);
    }
    return id;
  };

  const updateItems = (next: ChipItem[]) => {
    items = next;
    onItemsChange?.(next);
  };

  const removeAt = (index: number) => updateItems(list.filter((_, itemIndex) => itemIndex !== index));

  const chipElements = () =>
    Array.from(root?.querySelectorAll<HTMLElement>('[data-chip-item]') ?? []);

  const focusIndex = (index: number) => {
    const elements = chipElements();
    if (!elements.length) return;
    const normalized = (index + elements.length) % elements.length;
    elements[normalized]?.focus();
    elements[normalized]?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (variant !== 'input' || !focused) return;
    const elements = chipElements();
    const active = document.activeElement as HTMLElement | null;
    const currentIndex = elements.indexOf(active as HTMLElement);
    if (event.key === 'ArrowLeft' && elements.length) {
      event.preventDefault();
      focusIndex(currentIndex > 0 ? currentIndex - 1 : elements.length - 1);
    } else if (event.key === 'ArrowRight' && elements.length) {
      event.preventDefault();
      focusIndex(currentIndex >= 0 ? (currentIndex + 1) % elements.length : 0);
    } else if (event.key === 'Home' && elements.length) {
      event.preventDefault();
      focusIndex(0);
    } else if (event.key === 'End' && elements.length) {
      event.preventDefault();
      focusIndex(elements.length - 1);
    } else if (event.key === 'Backspace' && currentIndex < 0 && elements.length) {
      event.preventDefault();
      focusIndex(elements.length - 1);
    }
  };

  const createItem = (value: string) => {
    const normalized = value.replace(/(&nbsp;)+/g, ' ').trim();
    if (!normalized || creating) return;
    creating = true;
    const newItem: ChipItem = { label: normalized };
    updateItems([...list, newItem]);
    requestAnimationFrame(() => {
      creating = false;
      editingId = itemId(newItem);
      requestAnimationFrame(() => focusIndex(list.length - 1));
    });
  };
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  {...rest}
  bind:this={root}
  role="list"
  aria-label={label}
  class={styles.current['chips']}
  tabindex={variant === 'input' ? 0 : undefined}
  onfocus={(event) => { if (event.target === event.currentTarget) focused = true; }}
  onblur={(event) => { if (!(event.relatedTarget instanceof Node && root?.contains(event.relatedTarget))) { focused = false; editingId = undefined; } }}
  onkeydown={handleKeydown}
>
  {#each list as item, index (itemId(item))}
    {@const id = itemId(item)}
    <span data-chip-item role="listitem" class="contents">
      <Chip
        label={item.label}
        icon={item.icon}
        variant={item.variant}
        disabled={item.disabled}
        href={item.href}
        selected={item.selected}
        defaultSelected={item.selected}
        onSelectedChange={item.selected === undefined ? undefined : (selected) => updateItems(list.map((candidate, itemIndex) => itemIndex === index ? { ...candidate, selected } : candidate))}
        onRemove={variant === 'input' || item.removable ? () => removeAt(index) : undefined}
        editable={variant === 'input'}
        editing={editingId === id}
        draggable={draggable}
        onfocus={() => { focused = true; editingId = id; }}
        onblur={() => { if (editingId === id) editingId = undefined; }}
        onEditCommit={(nextLabel) => updateItems(list.map((candidate, itemIndex) => itemIndex === index ? { ...candidate, label: nextLabel } : candidate))}
        onChange={() => { if (index === list.length - 1) root?.scrollTo({ left: root.scrollWidth, behavior: 'smooth' }); }}
      />
    </span>
  {/each}

  {#if focused && variant === 'input'}
    <Divider orientation="vertical" class="border-outline animate-[var(--animate-blink)]" style="--animate-blink: blink 1s cubic-bezier(0.4, 0, 0.6, 1) infinite" />
    <style>
      @keyframes blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }
    </style>
  {/if}

  {#if variant === 'input' && (focused || list.length === 0)}
    <Chip
      label=""
      class="opacity-0"
      editable
      editing
      draggable={draggable}
      onfocus={() => { focused = true; }}
      onblur={() => { focused = false; }}
      onChange={createItem}
      onEditCommit={() => undefined}
    />
  {/if}
</div>
