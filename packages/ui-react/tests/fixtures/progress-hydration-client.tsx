import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { ProgressHydrationFixture } from './progress-hydration';
const root = hydrateRoot(
  document.getElementById('root')!,
  <ProgressHydrationFixture />,
  {
    onRecoverableError: (error) =>
      (window as any).hydrationErrors.push(String(error)),
  },
);
(window as any).dispose = () => root.unmount();
