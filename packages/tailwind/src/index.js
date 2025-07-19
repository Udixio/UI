// add-primary-color.js
import plugin from 'tailwindcss/plugin';
import { createTheme } from '@udixio/theme';

module.exports = plugin.withOptions(
  // 1) factory(options) → la fonction “handler” du plugin
  (options = {}) => {
    const { plugins } = createTheme();
    return function async({ addUtilities, theme, addComponents }) {
      plugins.forEach((udixioPlugin) => {
        console.log(udixioPlugin);
        if (typeof udixioPlugin.handler !== 'function') {
          console.error('Plugin invalide détecté :', udixioPlugin);
        } else {
          udixioPlugin.handler({ addComponents, addUtilities, theme });
        }
      });
      // vous pourriez créer ici des utilitaires avec addUtilities()
      // par exemple pour raccourcir l’usage de primary
      // const utils = {
      //   '.text-primary': { color: theme('colors.primary.DEFAULT') },
      // }
      // addUtilities(utils, { variants: ['responsive', 'hover'] })
    };
  },
  // 2) config(options) → objet à merger dans tailwind.config
  (options = {}) => {
    return {
      theme: {
        extend: {
          colors: {
            // on récupère l’objet options.palette ou on tombe
            // sur un fallback minimal
            primary: options.palette || {
              50: '#f0f5ff',
              100: 'rgba(245,17,17,0.82)',
              500: '#6366f1',
              700: '#b9b6da',
              DEFAULT: '#b71b1b',
            },
          },
        },
      },
    };
  },
);
