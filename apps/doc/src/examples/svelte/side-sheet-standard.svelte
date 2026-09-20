<script lang="ts">
  import { SideSheet } from '@udixio/ui-svelte';
</script>

<div class="flex h-[36rem] w-full overflow-hidden rounded-xl border border-outline">
  <div class="flex-1 overflow-y-auto p-4">
    <p class="text-title-medium">Page content</p>
    <p class="text-body-medium text-on-surface-variant">The standard side sheet is persistent layout chrome that spans the full height of the page next to the content it supports.</p>
  </div>
  <SideSheet title="Details" position="right">
    <p class="p-4 text-body-medium text-on-surface-variant">Side content</p>
  </SideSheet>
</div>
