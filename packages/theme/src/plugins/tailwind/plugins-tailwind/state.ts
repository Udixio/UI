// from tailwindcss src/util/flattenColors
import plugin from 'tailwindcss/plugin';
import { PluginAPI } from 'tailwindcss/types/config';

type State = {
  statePrefix: string;
  disabledStyles: {
    textOpacity: number;
    backgroundOpacity: number;
  };
  transition: {
    duration: number;
  };
};

type Components = Record<string, Record<string, {}>>;

export const state = (colorkeys: string[]) =>
  plugin((pluginArgs: PluginAPI) => {
    addAllNewComponents(
      pluginArgs,
      {
        statePrefix: 'state',
        disabledStyles: {
          textOpacity: 0.38,
          backgroundOpacity: 0.12,
        },
        transition: {
          duration: 150,
        },
      },
      colorkeys
    );
  }, {});

const addAllNewComponents = (
  { addComponents }: PluginAPI,
  { statePrefix, disabledStyles, transition }: State,
  colorKeys: string[]
) => {
  const newComponents: Components = {};

  for (const isGroup of [false, true]) {
    const group = isGroup ? 'group-' : '';
    for (const colorName of colorKeys) {
      const className = `.${group}${statePrefix}-${colorName}`;
      newComponents[className] = {
        [`@apply ${group}hover:bg-${colorName}/[0.08]`]: {},
        [`@apply ${group}active:bg-${colorName}/[0.12]`]: {},
        [`@apply ${group}focus-visible:bg-${colorName}/[0.12]`]: {},
      };
      if (transition) {
        newComponents[className][`@apply transition-colors`] = {};
        newComponents[className][`@apply duration-${transition.duration}`] = {};
      }
      if (disabledStyles) {
        newComponents[className][
          `@apply ${group}disabled:text-on-surface/[${disabledStyles.textOpacity}]`
        ] = {};
        newComponents[className][
          `@apply ${group}disabled:bg-on-surface/[${disabledStyles.backgroundOpacity}]`
        ] = {};
      }
    }
  }
  for (const colorName of colorKeys) {
    for (const stateName of ['hover', 'active', 'focus', 'disabled']) {
      const className = `.${stateName}-${statePrefix}-${colorName}`;
      if (stateName === 'active' || stateName === 'focus') {
        newComponents[className] = {
          [`@apply bg-${colorName}/[0.12]`]: {},
        };
      } else if (stateName === 'hover') {
        newComponents[className] = {
          [`@apply bg-${colorName}/[0.08]`]: {},
        };
      } else if (stateName === 'disabled') {
        newComponents[className] = {
          [`@apply text-on-surface/[${disabledStyles.textOpacity}]`]: {},
        };
        newComponents[className] = {
          [`@apply bg-on-surface/[${disabledStyles.backgroundOpacity}]`]: {},
        };
      }
    }
  }
  addComponents(newComponents);
};
