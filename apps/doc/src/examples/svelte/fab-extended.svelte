<script lang="ts">
  import { Button, Fab } from '@udixio/ui-svelte';
  import { iEdit } from '@udixio/icons-rounded-400/edit';

  let extended = $state(true);
</script>

<div class="flex flex-col items-end gap-6">
  <Button
    label={extended ? 'Collapse the fab' : 'Extend the fab'}
    variant="outlined"
    onclick={() => (extended = !extended)}
  />
  <Fab label="Compose" icon={iEdit} {extended} />
</div>
