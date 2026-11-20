<script lang="ts">
  import { defineValue } from '@udixio/motion/value';
  import { Button, motionValue } from '@udixio/ui-svelte';

  // A counter: a state value with a format, written as its number and as the text of its element.
  defineValue('visitors-count', {
    source: 'state',
    format: 'integer',
    range: [0, 100000],
  });

  let visitors = $state(12480);
</script>

<div class="flex flex-col items-start gap-4">
  <data
    {@attach motionValue('visitors-count')}
    value={visitors}
    class="block text-display-small text-on-surface">12480</data
  >
  <Button size="small" label="Add 1,000 visitors" onclick={() => (visitors += 1000)} />
</div>
