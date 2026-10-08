<script lang="ts">
  import { defineConfig } from '@udixio/tailwind';
  import { Button, ThemeProvider } from '@udixio/ui-svelte';

  const themeConfig = defineConfig({
    sourceColor: '#6750A4',
    dynamicSelector: '.dynamic',
  });
</script>

<ThemeProvider config={themeConfig}>
  <div class="dynamic">
    <Button label="Themed action" />
  </div>
</ThemeProvider>
