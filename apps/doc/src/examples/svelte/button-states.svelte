<script lang="ts">
  import { Button } from '@udixio/ui-svelte';
</script>

<div class="flex flex-wrap items-center justify-center gap-3">
  <Button label="Disabled" disabled />
  <Button label="Sending" loading />
  <Button label="Rounded" shape="rounded" variant="tonal" />
  <Button label="Squared" shape="squared" variant="outlined" />
  <Button label="Static shape" shapeFeedback="none" variant="text" />
</div>
