<script lang="ts">
  import { TextField } from '@udixio/ui-svelte';
  import { iClose } from '@udixio/icons-rounded-400/close';
  import { iSearch } from '@udixio/icons-rounded-400/search';
</script>

<div class="flex flex-col gap-4">
  <TextField label="Search" name="q" leadingIcon={iSearch} />
  <TextField label="Amount" name="amount" suffix="kg" />
  <TextField label="Search" name="q2" trailingIcon={iClose} />
  <TextField
    label="Search"
    name="q3"
    variant="outlined"
    leadingIcon={iSearch}
    trailingIcon={iClose}
  />
</div>
