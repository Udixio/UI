<script lang="ts">
  import { TextField } from '@udixio/ui-svelte';
</script>

<div class="flex flex-wrap items-end gap-6">
  <TextField label="Name" name="name" class="w-72" />
  <TextField
    label="Code"
    name="code"
    supportingText="Uppercase letters only"
    classes={{ input: 'uppercase tracking-widest', supportingText: 'italic' }}
  />
</div>
