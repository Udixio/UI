<script lang="ts">
  import { DatePicker } from '@udixio/ui-svelte';
</script>

<DatePicker defaultValue={new Date(2024, 5, 15)} onChange={(value) => console.log('Selected:', value)} />
