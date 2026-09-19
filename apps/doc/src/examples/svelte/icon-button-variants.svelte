<script lang="ts">
  import { IconButton } from '@udixio/ui-svelte';
  import { iAdd } from '@udixio/icons-rounded-400/add';
</script>

<div class="flex flex-wrap items-center gap-3">
  <IconButton label="Standard" icon={iAdd} variant="standard" />
  <IconButton label="Filled" icon={iAdd} variant="filled" />
  <IconButton label="Tonal" icon={iAdd} variant="tonal" />
  <IconButton label="Outlined" icon={iAdd} variant="outlined" />
</div>
