import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { SliderHydrationFixture } from './slider-hydration';

const root = hydrateRoot(
  document.getElementById('root')!,
  <SliderHydrationFixture />,
  {
    onRecoverableError: (error) =>
      (window as any).hydrationErrors.push(String(error)),
  },
);
(window as any).dispose = () => root.unmount();
