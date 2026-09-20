<script lang="ts">
  import { Chip } from '@udixio/ui-svelte';
</script>

<div class="flex flex-wrap gap-3">
  <Chip label="Action" onclick={() => console.info('Action')} />
  <Chip label="Documentation" href="/components/chip" />
</div>
