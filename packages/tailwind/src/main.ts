import plugin from 'tailwindcss/plugin';
import { stateGroup } from './plugins-tailwind/state-group';
import { motionName } from './plugins-tailwind/motion-name';

/** The Tailwind plugin behind `@plugin "@udixio/tailwind"`: the `state-group` and `motion-name` utilities. */
export const main = plugin((api) => {
  stateGroup.handler(api);
  motionName.handler(api);
});
