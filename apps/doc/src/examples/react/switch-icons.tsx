import { useState } from 'react';
import { Switch } from '@udixio/ui-react';
import { iDarkMode } from '@udixio/icons-rounded-400/dark_mode';
import { iLightMode } from '@udixio/icons-rounded-400/light_mode';

export default function SwitchIconsReact() {
  const [checked, setChecked] = useState(true);

  return (
    <Switch
      aria-label="Theme"
      checked={checked}
      onCheckedChange={setChecked}
      activeIcon={iLightMode}
      inactiveIcon={iDarkMode}
    />
  );
}
