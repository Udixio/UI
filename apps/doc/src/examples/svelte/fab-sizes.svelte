<script lang="ts">
  import { Fab } from '@udixio/ui-svelte';
  import { iEdit } from '@udixio/icons-rounded-400/edit';
</script>

<div class="flex flex-wrap items-end justify-end gap-4">
  <Fab label="Small" icon={iEdit} size="small" />
  <Fab label="Medium" icon={iEdit} size="medium" />
  <Fab label="Large" icon={iEdit} size="large" />
</div>
