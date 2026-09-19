<script lang="ts">
  import { Button } from '@udixio/ui-svelte';

  let message = $state('');
</script>

<div class="flex flex-col items-center gap-3">
  <div class="flex flex-wrap justify-center gap-3">
    <Button label="Run action" onclick={() => (message = 'Action run')} />
    <Button
      label="Button documentation"
      href="/components/button/overview"
      aria-current="page"
      variant="outlined"
    />
  </div>
  <p aria-live="polite" class="text-body-medium">{message}</p>
</div>
