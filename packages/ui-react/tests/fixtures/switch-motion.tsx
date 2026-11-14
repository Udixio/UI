import React from 'react';
import { createRoot } from 'react-dom/client';
import { Switch } from '../../src/lib/components/Switch';
const state = window as unknown as {
  changes: boolean[];
  events: [string, boolean, boolean][];
  dispose: () => void;
};
state.changes = [];
state.events = [];
const root = createRoot(document.getElementById('root')!);
root.render(
  <>
    <Switch
      aria-label="Enabled"
      onCheckedChange={(value) => state.changes.push(value)}
      onKeyDown={(event) =>
        state.events.push([
          event.key,
          (event.target as HTMLElement).getAttribute('role') === 'switch',
          event.target === event.currentTarget,
        ])
      }
    />
    <Switch
      aria-label="Disabled"
      disabled
      onCheckedChange={(value) => state.changes.push(value)}
    />
  </>,
);
state.dispose = () => root.unmount();
