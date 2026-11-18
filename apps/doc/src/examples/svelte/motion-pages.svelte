<script lang="ts">
  import { goto } from '$app/navigation';
  import { navigate, type NavigationDirection } from '@udixio/motion/page';

  // A link that changes the page inside a View Transition, in the direction of travel.
  function go(href: string, direction: NavigationDirection = 'forward') {
    return navigate(
      () => goto(href),
      { direction },
    );
  }
</script>

<button type="button" onclick={() => go('/motion/scroll')}>Next page</button>
<button type="button" onclick={() => go('/motion', 'back')}>Previous page</button>
