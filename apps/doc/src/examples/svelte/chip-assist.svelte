<script lang="ts">
  import { iAdd } from '@udixio/icons-rounded-400/add';
  import { Chip } from '@udixio/ui-svelte';
</script>

<Chip label="Nouveau" icon={iAdd} onclick={() => console.info('Nouvelle action')} />
