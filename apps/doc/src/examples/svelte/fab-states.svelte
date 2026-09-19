<script lang="ts">
  import { Fab } from '@udixio/ui-svelte';
  import { iAdd } from '@udixio/icons-rounded-400/add';
</script>

<div class="flex flex-wrap items-end justify-end gap-4">
  <Fab label="Disabled action" icon={iAdd} disabled extended />
  <Fab
    label="Disabled link"
    icon={iAdd}
    href="/components/fab/overview"
    disabled
    extended
  />
  <Fab label="Disabled compact" icon={iAdd} disabled />
</div>
