// add-primary-color.js
const plugin = require('tailwindcss/plugin');

module.exports = plugin.withOptions(
  // 1) factory(options) → la fonction “handler” du plugin
  (options = {}) => {
    return function ({ addUtilities, theme }) {
      // vous pourriez créer ici des utilitaires avec addUtilities()
      // par exemple pour raccourcir l’usage de primary
      // const utils = {
      //   '.text-primary': { color: theme('colors.primary.DEFAULT') },
      // }
      // addUtilities(utils, { variants: ['responsive', 'hover'] })
    };
  },
  // 2) config(options) → objet à merger dans tailwind.config
  (options = {}) => ({
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
  }),
);
