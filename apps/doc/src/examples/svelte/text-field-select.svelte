<script lang="ts">
  import { TextField } from '@udixio/ui-svelte';

  const options = [
    { value: 'fr', label: 'France' },
    { value: 'de', label: 'Germany' },
    { value: 'jp', label: 'Japan' },
  ];
</script>

<TextField label="Country" name="country" type="select" {options} />
