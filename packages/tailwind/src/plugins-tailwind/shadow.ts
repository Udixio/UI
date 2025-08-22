import plugin, { PluginAPI } from 'tailwindcss/plugin';

export const shadow = plugin(
  ({ addUtilities }: Pick<PluginAPI, 'addUtilities'>) => {
    addUtilities({
      ['.shadow']: {
        boxShadow:
          '0 4px 10px #00000008, 0 0 2px #0000000f, 0 2px 6px #0000001f',
      },
      ['.shadow-1']: {
        boxShadow:
          '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
      },
      ['.shadow-2']: {
        boxShadow:
          '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
      },
      ['.shadow-3']: {
        boxShadow:
          '0px 1px 3px 0px rgba(0, 0, 0, 0.30), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
      },
      ['.shadow-4']: {
        boxShadow:
          '0px 2px 3px 0px rgba(0, 0, 0, 0.30), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
      },
      ['.box-shadow-5']: {
        boxShadow:
          '0px 4px 4px 0px rgba(0, 0, 0, 0.30), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
      },
    });
  },
);
