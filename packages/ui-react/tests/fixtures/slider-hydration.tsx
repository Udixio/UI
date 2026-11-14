import React from 'react';
import { Slider } from '../../src/lib/components/Slider';

export function SliderHydrationFixture() {
  React.useEffect(() => {
    (window as any).hydrated = true;
  }, []);
  return <Slider aria-label="Hydrated slider" defaultValue={20} />;
}
