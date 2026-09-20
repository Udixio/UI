<script lang="ts">
  import { DatePicker } from '@udixio/ui-svelte';
</script>

<div class="flex flex-wrap justify-center gap-8">
  <DatePicker locale="en-US" defaultValue={new Date(2024, 5, 1)} />
  <DatePicker locale="fr-FR" weekStartDay={1} defaultValue={new Date(2024, 5, 1)} />
</div>
