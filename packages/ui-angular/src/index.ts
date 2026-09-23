// The Angular package re-exports the shared contract, so a consumer needs one
// import for a component and the types of its inputs -- the React package has
// always done this, and its absence here left `FabMenuAction` and friends
// reachable only from `@udixio/core`.
export * from '@udixio/core';
export * from './lib/anchor-positioner/anchor-positioner';
export * from './lib/badge/badge';
export * from './lib/badge/badge-surface';
export * from './lib/button/button';
export * from './lib/card/card';
export * from './lib/carousel/carousel';
export * from './lib/carousel/carousel-item';
export * from './lib/checkbox/checkbox';
export * from './lib/date-picker/date-picker';
export * from './lib/divider/divider';
export * from './lib/fab/fab';
export * from './lib/fab-menu/fab-menu';
export * from './lib/icon/icon';
export * from './lib/icon-button/icon-button';
export * from './lib/menu/menu';
export * from './lib/menu/menu-item';
export * from './lib/menu/menu-group';
export * from './lib/menu/menu-headline';
export * from './lib/context-menu/context-menu';
export * from './lib/navigation-rail/navigation-rail';
export * from './lib/navigation-rail/navigation-rail-item';
export * from './lib/navigation-rail/navigation-rail-section';
export * from './lib/progress-indicator/progress-indicator';
export * from './lib/side-sheet/side-sheet';
export * from './lib/slider/slider';
export * from './lib/snackbar/snackbar';
export * from './lib/chip/chip';
export * from './lib/chips/chips';
export * from './lib/state-layer/state-layer';
export * from './lib/switch/switch';
export * from './lib/tabs/tab';
export * from './lib/tabs/tabs';
export * from './lib/tabs/tab-group';
export * from './lib/tabs/tab-panels';
export * from './lib/tabs/tab-panel';
export * from './lib/text-field/text-field';
export * from './lib/toolbar/toolbar';
export * from './lib/search/search';
export * from './lib/tooltip/tooltip';
export * from './lib/tooltip/tooltip-surface';
export * from './lib/utils/create-controllable-state';

// `Icon` exists both as a type in @udixio/core and as the Angular component in
// ./lib/icon/icon; the component is the public API, as in the React package.
export { Icon } from './lib/icon/icon';
