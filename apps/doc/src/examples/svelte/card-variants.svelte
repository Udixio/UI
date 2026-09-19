<script lang="ts">
  import { Card } from '@udixio/ui-svelte';
</script>

<div class="flex w-full flex-wrap gap-4">
  <Card class="flex h-40 min-w-48 flex-1 items-center justify-center">
    <p>Outlined</p>
  </Card>
  <Card variant="elevated" class="flex h-40 min-w-48 flex-1 items-center justify-center">
    <p>Elevated</p>
  </Card>
  <Card variant="filled" class="flex h-40 min-w-48 flex-1 items-center justify-center">
    <p>Filled</p>
  </Card>
</div>
