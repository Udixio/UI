import { defineConfig } from '@udixio/ui-react';

export default defineConfig({
  sourceColor: '#D0BCFE',
  palettes: {
    success: '#339900',
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
