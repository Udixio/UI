import { useState } from 'react';
import { Checkbox } from '@udixio/ui-react';

export default function CheckboxStatesReact() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex items-center gap-3">
        <Checkbox
          id="checkbox-react-controlled"
          checked={checked}
          onCheckedChange={setChecked}
        />
        <label htmlFor="checkbox-react-controlled">Controlled</label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="checkbox-react-default" defaultChecked />
        <label htmlFor="checkbox-react-default">Default checked</label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="checkbox-react-disabled" disabled />
        <label htmlFor="checkbox-react-disabled">Disabled</label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          id="checkbox-react-disabled-checked"
          defaultChecked
          disabled
        />
        <label htmlFor="checkbox-react-disabled-checked">
          Disabled and checked
        </label>
      </div>
    </div>
  );
}
