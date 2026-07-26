import plugin from 'tailwindcss/plugin';
import { animation, AnimationPluginOptions } from './plugins-tailwind/animation';
import { stateGroup } from './plugins-tailwind/state-group';

export const main = plugin.withOptions<AnimationPluginOptions>((options = {}) => {
  return (api) => {
    animation(options).handler(api);
    stateGroup.handler(api);
  };
});
