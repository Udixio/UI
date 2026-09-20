<script lang="ts">
  import { Button, Snackbar } from '@udixio/ui-svelte';

  let open = $state(false);
</script>

<div class="flex flex-col items-start gap-4">
  <Button label="Save" onclick={() => (open = true)} />
  <Snackbar message="Saved" duration={3000} bind:open />
</div>
