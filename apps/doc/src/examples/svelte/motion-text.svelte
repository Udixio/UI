<script lang="ts">
  import { defineMotion } from '@udixio/motion';
  import { Button, motion } from '@udixio/ui-svelte';

  // Each word rises and fades in, in turn. A line plays again when it becomes the current one.
  defineMotion('headline', {
    verb: 'reveal',
    split: 'words',
    reduced: 'fade',
    keyframes: [
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0 },
    ],
  });

  const LINES = [
    'Every word arrives in turn, and is read once.',
    'The light comes in slowly, one word at a time.',
    'Let the last word settle.',
  ];

  let line = $state(0);
</script>

<div class="flex flex-col items-start gap-4">
  <!-- One paragraph per line: the others stay hidden, and their words are not rewritten. -->
  {#each LINES as text, index (text)}
    <p
      {@attach motion('headline', () => ({ state: line === index }))}
      class:hidden={line !== index}
      class="text-headline-medium text-on-surface"
    >
      {text}
    </p>
  {/each}
  <Button size="small" label="Next line" onclick={() => (line = (line + 1) % LINES.length)} />
</div>
