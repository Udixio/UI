import { defineConfig } from '@udixio/tailwind';

export default defineConfig({
  sourceColor: '#D0BCFE',
  palettes: {
    success: () => ({ chroma: 75, hue: 139 }),
  },
  subThemes: {
    warning: '#ffcc00',
  },
  fontFamily: {
    expressive: ['var(--font-montserrat)', 'sans-serif'],
    neutral: ['var(--font-roboto)', 'sans-serif'],
  },
  outFile: 'src/styles/udixio.generated.css',
});
