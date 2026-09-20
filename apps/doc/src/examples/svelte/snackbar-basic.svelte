<script lang="ts">
  import { Button, Snackbar } from '@udixio/ui-svelte';

  let open = $state(false);
</script>

<div class="flex flex-col items-start gap-4">
  <Button label="Send message" onclick={() => (open = true)} />
  <Snackbar message="Message sent" bind:open />
</div>
