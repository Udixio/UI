import React from 'react';
import { Switch } from '../../src/lib/components/Switch';

export function SwitchHydrationFixture() {
  React.useEffect(() => {
    (window as any).hydrated = true;
  }, []);
  return <Switch aria-label="Hydrated switch" defaultChecked />;
}
