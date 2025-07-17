const plugin = require('tailwindcss/plugin');

module.exports = plugin.withOptions(
  // 1. Callback pour options
  ({ className = 'caret' } = {}) => {
    return ({ addUtilities, theme, variants }) => {
      const colors = theme('colors');
    };
  },
  // 2. Options par défaut (optionnel)
  () => ({
    variants: {
      caretColor: ['responsive', 'hover', 'focus'],
    },
  }),
);
