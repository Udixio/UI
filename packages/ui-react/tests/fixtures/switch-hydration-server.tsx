import React from 'react';
import { renderToString } from 'react-dom/server';
import { SwitchHydrationFixture } from './switch-hydration';

export function renderSwitchHydrationFixture() {
  return renderToString(<SwitchHydrationFixture />);
}
