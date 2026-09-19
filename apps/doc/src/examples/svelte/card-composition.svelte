<script lang="ts">
  import { Button, Card } from '@udixio/ui-svelte';
</script>

<Card variant="filled" class="w-full max-w-96">
  <img class="h-40 w-full object-cover" src="https://picsum.photos/640/240" alt="" />
  <div class="space-y-2 p-4">
    <p class="text-title-medium">Project Aurora</p>
    <p class="text-body-medium text-on-surface-variant">Last updated 2 days ago</p>
    <div class="flex gap-2 pt-2">
      <Button label="Open" size="small" variant="filled" />
      <Button label="Share" size="small" variant="text" edgeAligned={false} />
    </div>
  </div>
</Card>
