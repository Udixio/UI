<script lang="ts">
  import { IconButton } from '@udixio/ui-svelte';
  import { iAdd } from '@udixio/icons-rounded-400/add';
</script>

<div class="flex flex-wrap items-center gap-3">
  <IconButton label="Add item" icon={iAdd} />
  <IconButton label="Disabled action" icon={iAdd} disabled />
</div>
