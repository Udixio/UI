<script lang="ts">
  import { defineMotion } from '@udixio/motion';
  import { motion } from '@udixio/ui-svelte';

  // A motion names its timing by token: a spring, or a curve of a duration and an easing.
  defineMotion('panel-in', {
    verb: 'appear',
    keyframes: [
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0 },
    ],
    timing: 'spring.fast.spatial',
  });
</script>

<div {@attach motion('panel-in')}>
  Moves
</div>
