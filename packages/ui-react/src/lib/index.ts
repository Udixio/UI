export * from './components';
export * from './effects';
export * from './hooks';
export * from '@udixio/core';
export * from './icon';
export * from './config';
// `Icon` exists both as a type in @udixio/core and as the React component in
// ./icon; the component (which also re-exports the type) is the public API.
export { Icon } from './icon';
