<script lang="ts">
  // The first item has its text directly in the moving element, so a layout move stretches the text with the box.
  // The second wraps the text in a span, which keeps its shape: the layout corrects the span, not the text.
  import '@udixio/motion/presets';
  import { motion } from '@udixio/ui-svelte';
</script>

<ul>
  <li {@attach motion('reflow')}>One</li>
  <li {@attach motion('reflow')}><span>One</span></li>
</ul>
