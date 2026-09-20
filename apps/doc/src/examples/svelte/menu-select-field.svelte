<script lang="ts">
  import { TextField } from '@udixio/ui-svelte';

  const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
  ];
  let fruit = $state('apple');
</script>

<div class="w-full max-w-sm">
  <TextField type="select" label="Favorite fruit" bind:value={fruit} {options} />
</div>
