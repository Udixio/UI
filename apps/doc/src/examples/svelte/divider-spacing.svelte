<script lang="ts">
  import { Divider } from '@udixio/ui-svelte';
</script>

<div class="space-y-6">
  <div>
    <p class="mb-2">Tight spacing</p>
    <Divider class="my-1" />
  </div>
  <div>
    <p class="mb-2">Wide spacing</p>
    <Divider class="my-6" />
  </div>
  <div class="flex items-center gap-4">
    <span>Left</span>
    <Divider orientation="vertical" class="h-8" />
    <span>Right</span>
  </div>
</div>
