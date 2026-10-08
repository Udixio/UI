import { defineConfig } from '@udixio/tailwind';
import { ThemeProvider } from '@udixio/ui-react';

const themeConfig = defineConfig({
  sourceColor: '#6750A4',
  dynamicSelector: '.dynamic',
});

export default function ThemeProviderReactExample() {
  return (
    <ThemeProvider config={themeConfig}>
      <main className="dynamic">Application content</main>
    </ThemeProvider>
  );
}
