<script lang="ts">
  import { IconButton } from '@udixio/ui-svelte';
  import { iStar } from '@udixio/icons-rounded-400/star';
  import { iStarFilled } from '@udixio/icons-rounded-400/filled/star';

  let pressed = $state(false);
</script>

<div class="flex flex-wrap items-center gap-3">
  <IconButton
    label="Favorite (uncontrolled)"
    icon={iStar}
    pressedIcon={iStarFilled}
    variant="tonal"
    toggleable
    defaultPressed
  />
  <IconButton
    label="Favorite (bound)"
    icon={iStar}
    pressedIcon={iStarFilled}
    variant="tonal"
    toggleable
    bind:pressed
  />
</div>
