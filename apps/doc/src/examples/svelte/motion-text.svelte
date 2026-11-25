<script lang="ts">
  import { defineMotion } from '@udixio/motion';
  import { Button, motion } from '@udixio/ui-svelte';

  // Each word rises and fades in, in turn. A new line is a new state, so its words play again.
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
  <p
    {@attach motion('headline', () => ({ state: line }))}
    class="text-headline-medium text-on-surface"
  >
    {LINES[line]}
  </p>
  <Button size="small" label="Next line" onclick={() => (line = (line + 1) % LINES.length)} />
</div>
