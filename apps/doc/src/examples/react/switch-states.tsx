import { useState } from 'react';
import { Switch } from '@udixio/ui-react';

export default function SwitchStatesReact() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <Switch
        aria-label="Controlled"
        checked={checked}
        onCheckedChange={setChecked}
      />
      <Switch aria-label="Default checked" defaultChecked />
      <Switch aria-label="Disabled" disabled />
      <Switch aria-label="Disabled and checked" defaultChecked disabled />
    </div>
  );
}
