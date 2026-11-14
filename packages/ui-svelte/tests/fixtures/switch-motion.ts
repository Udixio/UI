import { mount, unmount } from 'svelte';
import Fixture from './switch-motion.svelte';
const state = window as unknown as {
  changes: boolean[];
  events: [string, boolean, boolean][];
  dispose: () => Promise<void>;
};
state.changes = [];
state.events = [];
const instance = mount(Fixture, { target: document.getElementById('root')! });
state.dispose = () => unmount(instance);
