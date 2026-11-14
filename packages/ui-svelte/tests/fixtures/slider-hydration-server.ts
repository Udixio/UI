import { render } from 'svelte/server';
import Fixture from './slider-hydration.svelte';

export const renderFixture = () => render(Fixture).body;
