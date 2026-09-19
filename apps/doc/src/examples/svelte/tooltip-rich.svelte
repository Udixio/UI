<script lang="ts">
  import { Button, tooltip } from '@udixio/ui-svelte';
</script>

{#snippet shortcuts()}
  <strong class="text-title-small">Shortcuts</strong>
  <p class="text-body-medium">Press Cmd+K to open the command palette.</p>
{/snippet}

<div class="flex flex-wrap items-center gap-6 p-8">
  <Button
    label="Rich tooltip"
    {@attach tooltip(() => ({
      variant: 'rich',
      title: 'Saved',
      text: 'Item added to favorites',
      buttons: { label: 'Undo' },
    }))}
  />

  <Button label="Custom content" {@attach tooltip(() => ({ variant: 'rich', content: shortcuts }))} />
</div>
