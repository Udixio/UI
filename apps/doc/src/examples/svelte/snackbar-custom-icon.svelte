<script lang="ts">
  import { iCheck } from '@udixio/icons-rounded-400/check';
  import { Button, Snackbar } from '@udixio/ui-svelte';

  let open = $state(false);
</script>

<div class="flex flex-col items-start gap-4">
  <Button label="Show" onclick={() => (open = true)} />
  <Snackbar message="Done" closeIcon={iCheck} bind:open />
</div>
