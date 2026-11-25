<script lang="ts">
  import { motion } from './motion.attachment.svelte';

  // A line of text in a split element: a new line is a new state, which plays its words.
  let { lines, line }: { lines: readonly string[]; line: number } = $props();
</script>

<p data-testid="lyric" {@attach motion('svelte-split-line', () => ({ state: line }))}>{lines[line]}</p>
