<script lang="ts">
  import { Chip } from '@udixio/ui-svelte';

  let label = $state('Double-cliquez pour modifier');
</script>

<Chip label={label} editable onEditCommit={(next) => (label = next)} />
