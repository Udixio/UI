<script lang="ts">
  import { TextField } from '@udixio/ui-svelte';
</script>

<div class="flex flex-col gap-4">
  <TextField label="Description" name="desc1" multiline />
  <TextField label="Notes" name="desc2" multiline defaultValue="Initial content" />
</div>
