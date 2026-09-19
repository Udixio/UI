<script lang="ts">
  import { Fab } from '@udixio/ui-svelte';
  import { iAdd } from '@udixio/icons-rounded-400/add';
  import { iShare } from '@udixio/icons-rounded-400/share';

  let message = $state('No action yet');
</script>

<div class="flex flex-col items-end gap-4">
  <div class="flex flex-wrap items-end justify-end gap-4">
    <Fab label="Create" icon={iAdd} extended onclick={() => (message = 'Action run')} />
    <Fab
      label="Share this page"
      icon={iShare}
      variant="tertiaryContainer"
      href="/components/fab/overview"
      aria-current="page"
      extended
    />
  </div>
  <p aria-live="polite" class="text-body-medium">{message}</p>
</div>
