<script lang="ts">
  import { Card } from '@udixio/ui-svelte';

  let message = $state('No action yet');
</script>

<div class="flex w-full flex-col items-center gap-3">
  <div class="flex w-full flex-wrap gap-4">
    <Card
      href="/components/card/overview"
      variant="elevated"
      class="flex h-40 min-w-48 flex-1 items-center justify-center"
    >
      <p>Navigate to the Card page</p>
    </Card>
    <Card
      interactive
      variant="filled"
      class="flex h-40 min-w-48 flex-1 items-center justify-center"
      onclick={() => (message = 'Card activated')}
    >
      <p>Run an action</p>
    </Card>
  </div>
  <p aria-live="polite" class="text-body-medium">{message}</p>
</div>
