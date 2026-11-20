<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '@udixio/ui-svelte';
  import { navigate, type NavigationDirection } from '@udixio/motion/page';

  // A link that changes the page inside a View Transition, in the direction of travel.
  function go(href: string, direction: NavigationDirection = 'forward') {
    return navigate(
      () => goto(href),
      { direction },
    );
  }
</script>

<div class="flex flex-wrap gap-2">
  <Button size="small" label="Next page" onclick={() => go('/motion/scroll')} />
  <Button size="small" variant="tonal" label="Previous page" onclick={() => go('/motion', 'back')} />
</div>
