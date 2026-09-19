<script lang="ts">
  import { Button } from '@udixio/ui-svelte';
  import { iAdd } from '@udixio/icons-rounded-400/add';
</script>

<div class="flex flex-wrap justify-center gap-3">
  <Button label="Add" icon={iAdd} />
  <Button label="Next" icon={iAdd} iconPosition="end" />
</div>
