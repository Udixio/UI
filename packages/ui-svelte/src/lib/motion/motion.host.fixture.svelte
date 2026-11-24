<script lang="ts">
  // Step C: the element the author wrote carries the state, its box the pixels. A Card takes the attachment on its root,
  // which is both; a wrapper declared with no box gives the pixels to the Card's root and keeps the state.
  import Card from '../card/Card.svelte';
  import { motion } from './motion.attachment.svelte';

  let { open = true }: { open?: boolean } = $props();
</script>

<Card data-testid="card" hidden={!open} {@attach motion('fade', () => ({ present: open }))}>Weekly report</Card>
<span
  data-testid="host"
  data-motion-box="child"
  class="[&:not([hidden])]:contents"
  hidden={!open}
  {@attach motion('fade', () => ({ present: open }))}
>
  <Card data-testid="boxed">Monthly report</Card>
</span>
