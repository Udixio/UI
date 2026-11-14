import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Slider } from '../../src/lib/components/Slider';
const state = window as unknown as { changes: number[]; dispose: () => void; removeEnabled: () => void };
state.changes = [];
const root = createRoot(document.getElementById('root')!);
function Fixture() {
  const [visible, setVisible] = useState(true);
  state.removeEnabled = () => setVisible(false);
  return <>{visible && <Slider aria-label="Enabled" defaultValue={20} onChange={value => state.changes.push(value)} />}<Slider aria-label="Other" defaultValue={40} /><Slider aria-label="Disabled" defaultValue={50} disabled onChange={value => state.changes.push(value)} /></>;
}
root.render(<Fixture />);
state.dispose = () => root.unmount();
