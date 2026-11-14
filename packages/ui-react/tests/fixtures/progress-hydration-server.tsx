import React from 'react';
import { renderToString } from 'react-dom/server';
import { ProgressHydrationFixture } from './progress-hydration';
export function renderProgressHydrationFixture() {
  return renderToString(<ProgressHydrationFixture />);
}
