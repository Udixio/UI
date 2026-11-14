import { flushSync, hydrate, unmount } from 'svelte';
import Fixture from './progress-hydration.svelte';

const instance = hydrate(Fixture, { target: document.getElementById('root')! });
flushSync();
(window as any).dispose = () => unmount(instance);
(window as any).hydrated = true;
