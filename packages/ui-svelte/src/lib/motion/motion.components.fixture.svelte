<script lang="ts">
  // TRIAL (review 5, Q3): the motion attachment on Udixio components, with no wrapper.
  import Button from '../button/Button.svelte';
  import Card from '../card/Card.svelte';
  import TextField from '../text-field/TextField.svelte';
  import { motion } from './motion.attachment.svelte';

  let { count = 0, href }: { count?: number; href?: string } = $props();
</script>

<Button label="Save" {href} {@attach motion('press', () => ({ state: count }))} />
<Card data-testid="card" {@attach motion('fade')}>Body</Card>
<TextField label="Code" {@attach motion('shake', () => ({ state: count }))} />
