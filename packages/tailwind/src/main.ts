import plugin from 'tailwindcss/plugin';
import { stateGroup } from './plugins-tailwind/state-group';

/** The Tailwind plugin behind `@plugin "@udixio/tailwind"`: the `state-group` utilities. */
export const main = plugin((api) => {
  stateGroup.handler(api);
});
