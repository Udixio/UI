// my-plugin.js
import { definePlugin } from 'tailwindcss/plugin';

export default definePlugin.withOptions(
  /**
   * Plugin fonction principale — ici tu reçois les options passées
   */
  (options) => {
    const color = options?.color || 'red';

    return function ({ addUtilities }) {
      addUtilities({
        [`.text-glow-${color}`]: {
          textShadow: `0 0 10px ${color}`,
        },
      });
    };
  },

  /**
   * (Optionnel) Étendre le thème Tailwind
   */
  (options) => ({
    theme: {
      extend: {
        colors: {
          custom: options?.color || 'red',
        },
      },
    },
  }),
);
