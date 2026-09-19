<script lang="ts">
  import { Divider } from '@udixio/ui-svelte';
</script>

<div class="flex items-center gap-4">
  <div>
    <p>Section A</p>
    <Divider />
    <p>Section B</p>
  </div>
  <Divider orientation="vertical" class="h-12" />
  <div>
    <p>Section C</p>
  </div>
</div>
