<script lang="ts">
  import { defineValue } from '@udixio/motion/value';
  import { Button, motionValue } from '@udixio/ui-svelte';

  // A counter: a state value with a format. Its number is the value attribute of its element, and its text follows it.
  defineValue('plays', {
    source: 'state',
    format: 'integer',
    range: [0, 100000],
  });

  let plays = $state(12480);
</script>

<div class="flex flex-col items-start gap-4">
  <data
    {@attach motionValue('plays')}
    value={plays}
    class="block text-display-small text-on-surface">12,480</data
  >
  <Button size="small" label="Add 1,000 plays" onclick={() => (plays += 1000)} />
</div>
