import { mount, unmount } from 'svelte';
import Fixture from './slider-motion.svelte';
const state = window as unknown as { changes: number[]; dispose: () => Promise<void> };
state.changes = [];
const instance = mount(Fixture, { target: document.getElementById('root')! });
state.dispose = () => unmount(instance);
