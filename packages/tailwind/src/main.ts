import plugin from 'tailwindcss/plugin';
import { animation, AnimationPluginOptions } from './plugins-tailwind/animation';

export const main = plugin.withOptions<AnimationPluginOptions>((options = {}) => {
  return (api) => {
    animation(options).handler(api);
  };
});
