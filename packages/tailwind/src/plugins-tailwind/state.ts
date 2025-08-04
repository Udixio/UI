import plugin, { PluginAPI } from 'tailwindcss/plugin';

export type StateOptions = {
  colorKeys: string[];
};

type ResolvedState = Required<NonNullable<StateOptions['config']>>;
type Components = Record<string, Record<string, {}>>;

const defaultConfig: ResolvedState = {
  statePrefix: 'state',
  disabledStyles: {
    textOpacity: 0.38,
    backgroundOpacity: 0.12,
  },
  transition: {
    duration: 150,
  },
};

export const state = plugin.withOptions(({ colorKeys }: StateOptions) => {
  const resolved: ResolvedState = {
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

  return ({ addComponents }: PluginAPI) => {
    const newComponents: Components = {};

    for (const isGroup of [false, true]) {
      const group = isGroup ? 'group-' : '';
      for (const colorName of colorKeys) {
        const className = `.${group}${resolved.statePrefix}-${colorName}`;
        newComponents[className] = {
          [`@apply ${group}hover:bg-${colorName}/[0.08]`]: {},
          [`@apply ${group}active:bg-${colorName}/[0.12]`]: {},
          [`@apply ${group}focus-visible:bg-${colorName}/[0.12]`]: {},
          [`@apply transition-colors`]: {},
          [`@apply duration-${resolved.transition.duration}`]: {},
          [`@apply ${group}disabled:text-on-surface/[${resolved.disabledStyles.textOpacity}]`]:
            {},
          [`@apply ${group}disabled:bg-on-surface/[${resolved.disabledStyles.backgroundOpacity}]`]:
            {},
        };
      }
    }

    for (const colorName of colorKeys) {
      for (const stateName of ['hover', 'active', 'focus', 'disabled']) {
        const className = `.${stateName}-${resolved.statePrefix}-${colorName}`;
        if (stateName === 'disabled') {
          newComponents[className] = {
            [`@apply text-on-surface/[${resolved.disabledStyles.textOpacity}]`]:
              {},
            [`@apply bg-on-surface/[${resolved.disabledStyles.backgroundOpacity}]`]:
              {},
          };
        } else {
          const opacity = stateName === 'hover' ? 0.08 : 0.12;
          newComponents[className] = {
            [`@apply bg-${colorName}/[${opacity}]`]: {},
          };
        }
      }
    }

    addComponents(newComponents);
  };
});
