import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { SwitchHydrationFixture } from './switch-hydration';

const root = hydrateRoot(
  document.getElementById('root')!,
  <SwitchHydrationFixture />,
  {
    onRecoverableError: (error) =>
      (window as any).hydrationErrors.push(String(error)),
  },
);
(window as any).dispose = () => root.unmount();
