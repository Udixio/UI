import plugin, { PluginAPI } from 'tailwindcss/plugin';

export type StateOptions = {
  colorKeys: string[];
};

type Components = Record<string, Record<string, object>>;

const defaultConfig = {
  disabledStyles: {
    textOpacity: 0.38,
    backgroundOpacity: 0.12,
  },
  transition: {
    duration: 150,
  },
};

export const state = plugin.withOptions(({ colorKeys }: StateOptions) => {
  const resolved = {
    ...defaultConfig,
    disabledStyles: {
      ...defaultConfig.disabledStyles,
      ...{},
    },
    transition: {
      ...defaultConfig.transition,
      ...{},
    },
  };

  return ({ matchUtilities, addUtilities }: PluginAPI) => {
    matchUtilities(
      {
        [`state-group`]: (groupName: string) => {
          const groupVariant = groupName ? `/${groupName}` : '';
          return {
            [`@apply group-hover${groupVariant}:bg-[var(--state-color)]/[0.08]`]:
              {},
            [`@apply group-active${groupVariant}:bg-[var(--state-color)]/[0.12]`]:
              {},
            [`@apply group-focus-visible${groupVariant}:bg-[var(--state-color)]/[0.12]`]:
              {},
            [`@apply transition-colors`]: {},
            [`@apply duration-${resolved.transition.duration}`]: {},
            [`@apply group-disabled${groupVariant}:text-on-surface/[${resolved.disabledStyles.textOpacity}]`]:
              {},
            [`@apply group-disabled${groupVariant}:bg-on-surface/[${resolved.disabledStyles.backgroundOpacity}]`]:
              {},
          };
        },
      },
      {
        values: {
          DEFAULT: '',
        },
      },
    );

    matchUtilities(
      {
        [`state-ripple-group`]: (groupName: string) => {
          const groupVariant = groupName ? `/${groupName}` : '';
          return {
            [`@apply group-hover${groupVariant}:bg-[var(--state-color)]/[0.08]`]:
              {},
            [`@apply group-focus-visible${groupVariant}:bg-[var(--state-color)]/[0.12]`]:
              {},
            [`@apply transition-colors`]: {},
            [`@apply duration-${resolved.transition.duration}`]: {},
            [`@apply group-disabled${groupVariant}:text-on-surface/[${resolved.disabledStyles.textOpacity}]`]:
              {},
            [`@apply group-disabled${groupVariant}:bg-on-surface/[${resolved.disabledStyles.backgroundOpacity}]`]:
              {},
          };
        },
      },
      {
        values: {
          DEFAULT: '',
        },
      },
    );

    addUtilities({
      [`.state-layer`]: {
        [`@apply hover:bg-[var(--state-color)]/[0.08]`]: {},
        [`@apply active:bg-[var(--state-color)]/[0.12]`]: {},
        [`@apply focus-visible:bg-[var(--state-color)]/[0.12]`]: {},
        [`@apply transition-colors`]: {},
        [`@apply duration-${resolved.transition.duration}`]: {},
        [`@apply disabled:text-on-surface/[${resolved.disabledStyles.textOpacity}]`]:
          {},
        [`@apply disabled:bg-on-surface/[${resolved.disabledStyles.backgroundOpacity}]`]:
          {},
      },
    });

    matchUtilities(
      {
        [`state`]: (colorName: string) => {
          return {
            [`--state-color`]: `var(--color-${colorName})`,
          };
        },
      },
      {
        values: colorKeys.reduce(
          (acc, key) => {
            acc[key] = key;
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
    );
  };
});
