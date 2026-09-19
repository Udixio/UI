<script lang="ts">
  import { Button, tooltip } from '@udixio/ui-svelte';
</script>

<div class="flex flex-wrap items-center gap-6 p-8">
  <Button label="Hover me" {@attach tooltip(() => ({ text: 'Copy to clipboard' }))} />

  <Button label="Click me" {@attach tooltip(() => ({ text: 'Opens on click', trigger: 'click' }))} />

  <Button label="Top" {@attach tooltip(() => ({ text: 'Top placement', position: 'top' }))} />
</div>
