import { render } from 'svelte/server';
import Fixture from './progress-hydration.svelte';

export const renderFixture = () => render(Fixture).body;
