<script lang="ts">
  import Button from '../button/Button.svelte';
  import { tooltip } from './tooltip.attachment.svelte';
  import type { SvelteTooltipProps } from './tooltip.types';

  /**
   * One trigger per entry, each carrying its own tooltip options; `custom`
   * swaps the built-in layout for a snippet.
   */
  let {
    triggers = [{ label: 'Trigger', text: 'Copy' }],
    custom = false,
    ariaDescribedby,
  }: {
    triggers?: (SvelteTooltipProps & { label: string })[];
    custom?: boolean;
    ariaDescribedby?: string;
  } = $props();
</script>

{#snippet customContent()}
  <span>Custom content</span>
{/snippet}

{#each triggers as { label, ...options } (label)}
  <Button
    {label}
    aria-describedby={ariaDescribedby}
    {@attach tooltip(() => ({ ...options, content: custom ? customContent : options.content }))}
  />
{/each}
