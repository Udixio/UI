<script lang="ts">
  import { Switch } from '@udixio/ui-svelte';
  import { iDarkMode } from '@udixio/icons-rounded-400/dark_mode';
  import { iLightMode } from '@udixio/icons-rounded-400/light_mode';

  let checked = $state(true);
</script>

<Switch
  aria-label="Theme"
  bind:checked
  activeIcon={iLightMode}
  inactiveIcon={iDarkMode}
/>
